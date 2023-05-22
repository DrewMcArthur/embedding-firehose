import Config from './config'
import EmbeddedFirehoseServer from './embedding-firehose-server'

const run = () => {
  new EmbeddedFirehoseServer(new Config()).run()
}

run()
