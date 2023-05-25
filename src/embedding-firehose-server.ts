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
import HttpForwardingServer from './http-forwarding'

export default class EmbeddedFirehoseServer extends FirehoseSubscriptionBase {
  server: CountingWebsocketServer
  embedder: Embedder
  costLimiter: CostLimiter
  httpForwarder: HttpForwardingServer

  constructor(db: Database, config: Config) {
    super(db, config.bskyFeedUri)

    this.embedder = new Embedder(config)
    this.costLimiter = new CostLimiter(config, db)
    this.server = new CountingWebsocketServer(config)
    this.httpForwarder = new HttpForwardingServer(this.server.getWss(), config)
    this.httpForwarder.start()
  }

  private async embedPost(post: CreateOp<PostRecord>): Promise<EmbeddedPost> {
    const tokens = this.embedder.tokenize(post.record.text)

    if (!this.costLimiter.shouldEmbed(tokens.length))
      return { uri: post.uri, embedding: null, numTokens: tokens.length }

    const { embedding, numTokensUsed } = await this.embedder.embed(tokens)

    await this.costLimiter.recordEmbedding({
      estimatedTokens: tokens.length,
      numTokensUsed,
      postUri: post.uri,
      postCid: post.cid,
      embedding,
    })

    return {
      uri: post.uri,
      embedding,
      numTokens: numTokensUsed,
    }
  }

  async handleEvent(event: RepoEvent): Promise<void> {
    if (this.server.numClients() === 0) return
    if (!isCommit(event)) return

    const ops = await getOpsByType(event)
    ops.posts.creates
      .map(p => this.embedPost(p))
      // filter out posts where embedding is undefined
      .filter(async p => (await p).embedding !== null)
      .forEach(p => this.server.broadcastEventAsync(p))
  }
}

export type EmbeddedPost = {
  uri: string
  embedding: number[] | null
  numTokens: number
}
