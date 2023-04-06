import { getAppConfig } from '../src/config';
import { PGVectorStore } from '../src/PGVectorStore';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from 'langchain';
import { RetrievalQAChain } from 'langchain/chains';

const question = 'Какой банк выбрать для ИП?';

async function main() {
  const config = getAppConfig();

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openAIApiKey,
  });

  const model = new OpenAI({
    openAIApiKey: config.openAIApiKey,
    temperature: 0.9,
  });

  const vectorStore = new PGVectorStore(embeddings, {
    connectionString: config.databaseUrl,
    tableName: 'documents',
  });

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(3));

  const res = await chain.call({
    query: question,
  });

  console.log(res.text);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
