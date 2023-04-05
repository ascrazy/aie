import { Client } from 'pg'
import { DBMessage, toFormat } from './src/db_schema'
import { getAppConfig } from './src/config'


async function main() {
  const config = getAppConfig()
  const pg = new Client({
    connectionString: config.databaseUrl,
  })
  await pg.connect()

  const res = await pg.query<DBMessage>('SELECT id, body, text FROM messages LIMIT 5')

  console.table(res.rows.map(row => toFormat(row)))

  await pg.end()
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
