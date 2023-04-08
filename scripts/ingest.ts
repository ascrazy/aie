import { format } from 'date-fns';
import ProgressBar from 'progress';
import { Pool } from 'pg';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';

import {
  readChatHistoryDump,
  preprocessChatHistory,
  ChatMessageType,
} from '../src/ChatHistory';
import { getAppConfig } from '../src/config';
import { PGVectorStore } from '../src/PGVectorStore';

async function main() {
  const config = getAppConfig();
  const pg = new Pool({ connectionString: config.databaseUrl });
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openAIApiKey,
  });
  const vectorStore = new PGVectorStore(embeddings, {
    tableName: config.ingestion.tableName,
    connection: pg,
  });
  const dump = await readChatHistoryDump(config.ingestion.dumpPath);
  const sourceMessages = dump.messages.filter((message) => {
    return message.date.getFullYear() >= 2023;
  });

  const grouped = {} as Record<string, ChatMessageType[]>;

  for (const message of sourceMessages) {
    const key = format(message.date, 'yyyy-MM');
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(message);
  }

  const bar = new ProgressBar('Ingesting :yyyyxmm [:bar] :percent :etas', {
    total: sourceMessages.length,
  });

  for (const [key, messages] of Object.entries(grouped)) {
    bar.tick(messages.length, {
      yyyyxmm: key,
    });
    const text = preprocessChatHistory(messages);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
    });
    const documents = await splitter.splitDocuments([
      new Document({
        pageContent: text,
        metadata: {
          yyyyxmm: key,
        },
      }),
    ]);

    await vectorStore.addDocuments(
      documents.map((doc) => {
        return {
          ...doc,
          pageContent: doc.pageContent
            // NOTE: remove newlines as ChatGPT works better with a single line
            .replace('\n', ' ')
            // NOTE: collapse any whitespace sequences to a single space
            .replace(/\s\s+/g, ' ')
            .trim(),
        };
      })
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
