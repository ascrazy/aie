import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import {
  readChatHistoryDump,
  getMessageText,
  Message,
} from '../src/chat_history';
import { getAppConfig } from '../src/config';
import { PGVectorStore, cleanPageContent } from '../src/db/documents';

const LIMIT = 5000;

async function main() {
  const config = getAppConfig();
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openAIApiKey,
  });
  const vectorStore = new PGVectorStore(embeddings, {
    connectionString: config.databaseUrl,
    tableName: 'documents',
  });
  const dump = await readChatHistoryDump('./data/chat-logs.json');

  const text = getTextFromAllMessages(dump.messages.slice(0, LIMIT));

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });

  const documents = await splitter.createDocuments([text]);

  await vectorStore.addDocuments(
    documents.map((doc) => {
      return {
        ...doc,
        pageContent: cleanPageContent(doc.pageContent),
      };
    })
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

function getTextFromAllMessages(messages: Message[]): string {
  let text = '';

  for (const message of messages) {
    if (message.type === 'service') {
      continue;
    }
    const messageText = getMessageText(message);
    if (!messageText) {
      continue;
    }

    text += messageText;
    text += '\n\n';
  }

  return text;
}
