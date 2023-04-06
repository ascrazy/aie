import { Client } from 'pg';
import { getAppConfig } from '../src/config';
import { cleanPageContent, querySimilarDocuments } from '../src/db/documents';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from 'langchain';

const question = 'Как зарегистрировать ИП';
const contextSize = 3;

async function main() {
  const config = getAppConfig();

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openAIApiKey,
  });
  const pg = new Client({
    connectionString: config.databaseUrl,
  });
  await pg.connect();

  const document = await embeddings.embedQuery(question);

  const context = await querySimilarDocuments(pg, document, contextSize);

  const model = new OpenAI({
    openAIApiKey: config.openAIApiKey,
    temperature: 0.9,
  });
  const ans = await model.call(
    `You are a consultant who helps people who just moved from Belarus to Poland to figure out how to open and run their own IP in Poland (JDG, jednoosobowa działalność gospodarcza po polsku)\nContext:\n${context
      .map((row) => cleanPageContent(row.page_content))
      .join('\n-----\n')}\nQuestion:\n${question}`
  );

  console.log(ans);

  await pg.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
