import { promises as fs } from 'fs'
import { Client } from 'pg'

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  await pg.connect()

  const res = await pg.query('SELECT id, body FROM messages LIMIT 10')

  console.table(res.rows[0].body)

  await pg.end()
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
