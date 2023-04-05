import { promises as fs } from 'fs'
import { Client } from 'pg'

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  const data = JSON.parse(await fs.readFile('./data/chat-logs.json', 'utf8'))

  await pg.connect()

  for (const message of data.messages.slice(0, 10)) {
    await pg.query('INSERT INTO messages (body) VALUES ($1)', [JSON.stringify(message)])
  }

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
