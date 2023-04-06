import { Client } from 'pg';
import { DBMessage } from '../src/db_schema';
import { getAppConfig } from '../src/config';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from 'langchain';
const question = 'Какой банк выбрать для ИП';
const contextSize = 10;

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

  const res = await pg.query<DBMessage>(
    'SELECT id, text FROM messages ORDER BY embeddings <#> $1 LIMIT $2',
    [JSON.stringify(document), contextSize]
  );

  const model = new OpenAI({
    openAIApiKey: config.openAIApiKey,
    temperature: 0.9,
  });
  const ans = await model.call(
    `Context:\n${res.rows
      .map((row) => row.text)
      .join('\n-----\n')}\nQuestion:\n${question}`
  );

  console.table(
    res.rows.map((r) => [r.id, r.text.replace('\n', ' ').slice(0, 100)])
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
