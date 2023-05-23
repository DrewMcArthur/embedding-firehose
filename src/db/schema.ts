export type DatabaseSchema = {
  api_call: ApiCall
}

export type ApiCall = {
  datetime: number // of ms since 1970
  estimatedTokens: number
  numTokensUsed: number
  cost: number // decimal to 1/1_000_000 precision? or just divide by a milli?
  postUri: string
  postCid: string
  embedding: string // JSON.stringify(number[1536])
}
