import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { Record as PostRecord } from './lexicon/types/app/bsky/feed/post'

import {
  CreateOp,
  FirehoseSubscriptionBase,
  getOpsByType,
} from './firehose-subscription-base'
import CountingWebsocketServer from './counting-ws-server'
import Embedder from './embedder'
import Config from './config'
import CostLimiter from './cost-limiter'
import { Database } from './db'

export default class EmbeddedFirehoseServer extends FirehoseSubscriptionBase {
  server: CountingWebsocketServer
  embedder: Embedder
  sampleRate: number | undefined
  costLimiter: CostLimiter

  constructor(db: Database, config: Config) {
    super(db, config.bskyFeedUri)

    this.embedder = new Embedder(config)
    this.costLimiter = new CostLimiter(config, db)
    this.server = new CountingWebsocketServer(config)
    this.sampleRate = config.sampleRate
  }

  private async embedPost(post: CreateOp<PostRecord>): Promise<EmbeddedPost> {
    const tokens = this.embedder.tokenize(post.record.text)

    if (!this.costLimiter.shouldEmbed(tokens.length))
      return { uri: post.uri, embedding: undefined }

    const { embedding, numTokensUsed } = await this.embedder.embed(tokens)

    await this.costLimiter.recordEmbedding({
      requestTime: new Date(),
      estimatedTokens: tokens.length,
      numTokensUsed,
      postUri: post.uri,
      postCid: post.cid,
      embedding,
    })

    return {
      uri: post.uri,
      embedding,
    }
  }

  private async serializeEmbeddedPost(
    post: Promise<EmbeddedPost>,
  ): Promise<string> {
    return JSON.stringify(await post)
  }

  async handleEvent(event: RepoEvent): Promise<void> {
    if (this.server.numClients() === 0) return
    if (!isCommit(event)) return

    const ops = await getOpsByType(event)
    ops.posts.creates
      .map(p => this.embedPost(p))
      .map(p => this.serializeEmbeddedPost(p))
      .forEach(p => this.server.broadcastEventAsync(p))
  }
}

type EmbeddedPost = {
  uri: string
  embedding: number[] | undefined
}
