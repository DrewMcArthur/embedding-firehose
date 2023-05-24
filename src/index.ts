import { createDb, migrateToLatest } from './db'
import Config from './config'
import EmbeddedFirehoseServer from './embedding-firehose-server'

const run = async () => {
  const config = new Config()
  let db = createDb(config.dbLocation)
  const server = new EmbeddedFirehoseServer(db, config)
  await migrateToLatest(db)
  await server.run()
}

run()
