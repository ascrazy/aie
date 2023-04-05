import { promises as fs } from 'fs'
import { Client } from 'pg'
import { DBMessage, toFormat } from './src/db_schema'

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  await pg.connect()

  const res = await pg.query<DBMessage>('SELECT id, body, text FROM messages LIMIT 10')

  console.table(res.rows.map(row => toFormat(row)))

  await pg.end()
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
