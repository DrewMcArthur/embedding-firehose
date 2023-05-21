# Embedding Firehose

A firehose of post embeddings, downstream of the bluesky firehose.

## Background

bluesky is a decentralized, open source social media network.
one of the pieces of bluesky is a firehose, which is a
websocket server that emits events for every post, like, and update on the network.

various apps might have the idea to generate embeddings via the openai api.
however, at the rate that new posts are created on bluesky, it doesn't make sense
to have a hundred different apps calling the openai api to generate embeddings for the same posts each second.

enter, the `embedded-firehose`. it too is a firehose of all the events on bluesky, but it emits events like:

```
{
    uri: string,
    embedding: number[1536]
}
```

where the `uri` is the same uri you'd see on an event from bluesky's firehose, and `embedding`
is an array of 1536 floats, exactly as you'd get from calling openAI's `createEmbedding` endpoint
using the `text-embedding-ada-002` model. see `embedder.ts` for the actual api call.

## Usage

1. I'll deploy this to a url, likely `embeddingfirehose.atproto.drewmca.dev`, where you can subscribe to events.
2. Write a function like `handleEvent(e: EmbeddingEvent)` that updates your db with the embedding received from this firehose.
3. Tell me that you found this useful, and consider contributing to my server costs, which i'll publish :)

## Architecture

- `config.ts`: `.env` config wrapper, `cp .env.example .env` for a quickstart
- `embedded-firehose-server.ts`: main class, extends the [`FirehoseSubscriptionBase` found in the `bluesky-social/feed-generator` repo](https://github.com/bluesky-social/feed-generator/blob/9395b18214e3283f8b562fe49f026decff12e308/src/util/subscription.ts#L16). Maps incoming created posts from the bluesky firehose to `EmbeddedPost`s.
- `counting-ws-server.ts`: the websocket server that clients can connect to, and emits the `EmbeddedPost` events
- `embedder.ts`: the service that actually calls the openai API
