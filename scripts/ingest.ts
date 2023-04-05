import { Client } from 'pg'
import { readChatHistoryDump, getMessageText } from '../src/chat_history'

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  const dump = await readChatHistoryDump('./data/chat-logs.json')

  await pg.connect()

  let ingested = 0;

  for (const message of dump.messages.slice(0, 30)) {
    if (message.type === 'service') {
      continue
    }
    const text = getMessageText(message)
    if (!text) {
      continue
    }
    await pg.query('INSERT INTO messages (body, text) VALUES ($1, $2)', [
      JSON.stringify(message),
      text,
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

// import { OpenAI } from "langchain";

// const model = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0.9 });
// const res = await model.call(
//     "What would be a good company name a company that makes colorful socks?"
//   );
//   console.log(res);
