import Config from "./config"
import EmbeddedFirehoseServer from "./embedded-firehose-server"

const run = () => {
    new EmbeddedFirehoseServer(new Config()).run()
}

run()

