import { Client } from 'pg'

import { readChatHistoryDump, getMessageText, Message } from '../src/chat_history'
import { getAppConfig } from '../src/config'
import { cleanPageContent, insertDocument } from '../src/db/documents';

const LIMIT = 5000;

async function main() {
  const config = getAppConfig()
  const { OpenAIEmbeddings } = await import('langchain/embeddings');
  const { RecursiveCharacterTextSplitter } = await import("langchain/text_splitter");
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.openAIApiKey,
  });
  const pg = new Client({
    connectionString: config.databaseUrl,
  })
  await pg.connect()

  const dump = await readChatHistoryDump('./data/chat-logs.json')

  const text = getTextFromAllMessages(dump.messages.slice(0, LIMIT))

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  })

  const documents = await splitter.createDocuments([text]);

  const docs_embeddings = await embeddings.embedDocuments(documents.map(doc => cleanPageContent(doc.pageContent)))

  for (let i = 0; i < docs_embeddings.length; i++) {
    await insertDocument(pg, {
      page_content: documents[i].pageContent,
      metadata: documents[i].metadata,
      embeddings: docs_embeddings[i],
    })
  }

  await pg.end()
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

function getTextFromAllMessages(messages: Message[]): string {
  let text = ''

  for (const message of messages) {
    if (message.type === 'service') {
      continue
    }
    const messageText = getMessageText(message)
    if (!messageText) {
      continue
    }

    text += messageText
    text += '\n\n'
  }

  return text;
}
