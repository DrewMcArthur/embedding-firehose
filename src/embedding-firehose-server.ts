import { OutputSchema as RepoEvent, isCommit } from "./lexicon/types/com/atproto/sync/subscribeRepos"
import { Record as PostRecord } from './lexicon/types/app/bsky/feed/post'

import { CreateOp, FirehoseSubscriptionBase, getOpsByType } from "./firehose-subscription-base"
import CountingWebsocketServer from "./counting-ws-server"
import Embedder from "./embedder"
import Config from './config'

export default class EmbeddedFirehoseServer extends FirehoseSubscriptionBase {
    server: CountingWebsocketServer
    embedder: Embedder

    constructor(config: Config) {
        super(undefined, config.bskyFeedUri)

        this.server = new CountingWebsocketServer(config)
        this.embedder = new Embedder(config)
    }

    async handleEvent(event: RepoEvent): Promise<void> {
        if (this.server.numClients() === 0) return
        if (!isCommit(event)) return

        const ops = await getOpsByType(event)
        ops.posts.creates
            .map(this.embedPost)
            .map(this.serializeEmbeddedPost)
            .forEach(this.server.broadcastEventAsync)
    }

    private async embedPost(post: CreateOp<PostRecord>): Promise<EmbeddedPost> {
        return {
            uri: post.uri,
            embedding: await this.embed(post.record.text)
        }
    }

    private async embed(text: string): Promise<number[]> {
        return await this.embedder.embed(text)
    }

    private async serializeEmbeddedPost(post: Promise<EmbeddedPost>): Promise<string> {
        return JSON.stringify(await post)
    }
}

type EmbeddedPost = {
    uri: string,
    embedding: number[]
}