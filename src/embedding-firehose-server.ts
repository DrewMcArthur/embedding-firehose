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

export default class EmbeddedFirehoseServer extends FirehoseSubscriptionBase {
  server: CountingWebsocketServer
  embedder: Embedder
  sampleRate: number | undefined

  constructor(config: Config) {
    super(undefined, config.bskyFeedUri)

    this.embedder = new Embedder(config)
    this.server = new CountingWebsocketServer(config)
    this.sampleRate = config.sampleRate
  }

  private randomSample(): boolean {
    return this.sampleRate === undefined || Math.random() < this.sampleRate
  }

  private async embed(text: string): Promise<number[]> {
    return await this.embedder.embed(text)
  }

  private async embedPost(post: CreateOp<PostRecord>): Promise<EmbeddedPost> {
    const embedding = await this.embed(post.record.text)
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
      .filter(p => this.randomSample())
      .map(p => this.embedPost(p))
      .map(p => this.serializeEmbeddedPost(p))
      .forEach(p => this.server.broadcastEventAsync(p))
  }
}

type EmbeddedPost = {
  uri: string
  embedding: number[]
}
