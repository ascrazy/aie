import { promises as fs } from 'fs'

async function main() {
  const data = JSON.parse(await fs.readFile('./data/chat-logs.json', 'utf8'))

  console.log(data.messages[0])
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
