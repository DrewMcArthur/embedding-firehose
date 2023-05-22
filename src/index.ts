import Config from './config'
import EmbeddedFirehoseServer from './embedding-firehose-server'

const run = () => {
  const config = new Config()
  const server = new EmbeddedFirehoseServer(config)
  server.run()
}

run()
