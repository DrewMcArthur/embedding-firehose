export type DatabaseSchema = {
  post: Post
  sub_state: SubState
  like: Like
}

export type Post = {
  uri: string
  cid: string
  text: string
  embedding: string // JSON {embeddings: number[]}
  replyParent: string | null
  replyRoot: string | null
  indexedAt: string
  score: number
}

export type SubState = {
  service: string
  cursor: number
}

export type Like = {
  author: string
  postUri: string
  postCid: string
  indexedAt: string
  trainedOn: boolean
}