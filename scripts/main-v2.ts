import { Client } from 'pg'
import { getAppConfig } from '../src/config'
import { cleanPageContent, querySimilarDocuments } from '../src/db/documents'

const question = 'Какой банк выбрать для ИП'
const contextSize = 3

async function main() {
  const config = getAppConfig()
  const { OpenAIEmbeddings } = await import('langchain/embeddings');
  const { OpenAI } = await import('langchain');

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openAIApiKey,
  });
  const pg = new Client({
    connectionString: config.databaseUrl,
  })
  await pg.connect()

  const document = await embeddings.embedQuery(question)

  const context = await querySimilarDocuments(pg, document, contextSize)

  const model = new OpenAI({ openAIApiKey: config.openAIApiKey, temperature: 0.9 });
  const ans = await model.call(`Context:\n${context.map(row => cleanPageContent(row.page_content)).join('\n-----\n')}\nQuestion:\n${question}`)

  console.log(ans)

  await pg.end()
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
