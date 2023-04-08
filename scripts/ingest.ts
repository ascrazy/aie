import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Pool } from 'pg';

import { readChatHistoryDump, preprocessChatHistory } from '../src/ChatHistory';
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

  const text = preprocessChatHistory(dump).slice(0, 1_000_000);

  console.time(`RecursiveCharacterTextSplitter on ${text.length} chars`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });

  const documents = await splitter.createDocuments([text]);

  console.timeEnd(`RecursiveCharacterTextSplitter on ${text.length} chars`);

  console.log(documents.slice(0, 5));

  await vectorStore.addDocuments(
    documents.map((doc) => {
      return {
        ...doc,
        pageContent: doc.pageContent.replace('\n', ''),
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
