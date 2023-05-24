import { createDb, migrateToLatest } from './db'
import Config from './config'
import EmbeddedFirehoseServer from './embedding-firehose-server'

const run = async () => {
  const config = new Config()
  let db = createDb(config.dbLocation)
  await migrateToLatest(db)
  const server = new EmbeddedFirehoseServer(db, config)
  await server.run()
}

run()
