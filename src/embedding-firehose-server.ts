import { OutputSchema as RepoEvent, isCommit } from "feed-generator/src/lexicon/types/com/atproto/sync/subscribeRepos";
import { FirehoseSubscriptionBase, getOpsByType } from "feed-generator/src/util/subscription"

import CountingWebsocketServer from "./counting-ws-server"
import Embedder from "./embedder";
import Config from './config';
import { createDb } from './db';

export default class EmbeddedFirehoseServer extends FirehoseSubscriptionBase {
    server: CountingWebsocketServer
    embedder: Embedder

    constructor(config: Config) {
        const db = createDb(config.sqliteLocation)
        super(db, config.bskyFeedUri)

        this.server = new CountingWebsocketServer(config)
        this.embedder = new Embedder(config)
    }

    async handleEvent(event: RepoEvent): Promise<void> {
        if (!isCommit(event)) return
        const ops = await getOpsByType(event)

        ops.posts.creates.map(
            async p => ({
                uri: p.uri,
                embedding: await this.embed(p.record.text)
            })
        )
            .map(async (e: Promise<EmbeddedPost>) => JSON.stringify(await e))
            .forEach(this.server.broadcastEventAsync)
    }

    private async embed(text: string): Promise<number[]> {
        return await this.embedder.embed(text)
    }
}

type EmbeddedPost = {
    uri: string,
    embedding: number[]
}