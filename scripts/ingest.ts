import { Client } from 'pg'
import ProgressBar from 'progress'

import { readChatHistoryDump, getMessageText } from '../src/chat_history'
import { getAppConfig } from '../src/config'

async function main() {
  const config = getAppConfig()
  const pg = new Client({
    connectionString: config.databaseUrl,
  })
  const { OpenAIEmbeddings } = await import('langchain/embeddings');
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openAIApiKey,
  });

  const dump = await readChatHistoryDump('./data/chat-logs.json')

  await pg.connect()

  const prevIngestedIds = await getPrevIngestedIds(pg)

  let ingested = 0;
  const bar = new ProgressBar('ingesting [:bar] :percent', {total: 300})

  for (const message of dump.messages.slice(0, 300)) {
    bar.tick()
    if (prevIngestedIds.has(message.id)) {
      continue
    }
    if (message.type === 'service') {
      continue
    }
    const text = getMessageText(message)
    if (!text) {
      continue
    }
    const documents = await embeddings.embedDocuments([text])
    await pg.query('INSERT INTO messages (id, body, text, embeddings) VALUES ($1, $2, $3, $4)', [
      message.id,
      JSON.stringify(message),
      text,
      JSON.stringify(documents[0]),
    ])
    ingested += 1
  }

  console.log(`Ingested ${ingested} messages`)

  await pg.end()
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

async function getPrevIngestedIds(pg: Client): Promise<Set<number>> {
  const res = await pg.query<{id: number}>('SELECT id FROM messages')

  return new Set(res.rows.map(row => row.id))
}
