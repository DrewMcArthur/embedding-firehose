import { createDb } from './db'
import Config from './config'
import EmbeddedFirehoseServer from './embedding-firehose-server'

const run = () => {
  const config = new Config()
  const db = createDb(config.dbLocation)
  const server = new EmbeddedFirehoseServer(db, config)
  server.run()
}

run()
