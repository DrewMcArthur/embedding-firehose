import Config from './config'
import { Database } from './db'
import { ApiCall } from './db/schema'

/// keeps track of the openai API usage over time, to stay below a certain $ burn rate
export default class CostLimiter {
  private timeOfLastApiCall: Date
  private desiredBurnRatePerDay: number
  private db: Database

  constructor(config: Config, db: Database) {
    this.db = db
    this.desiredBurnRatePerDay = config.desiredBurnRatePerDay
    this.timeOfLastApiCall = new Date()
  }

  public shouldEmbed(numTokens: number): boolean {
    const timeSinceLastApiCall =
      new Date().getTime() - this.timeOfLastApiCall.getTime()
    // console.debug(`checking if should embed, it's been ${timeSinceLastApiCall} ms`)

    const estimatedCost = (20 * numTokens) / 1_000_000 // openai.createEmbedding costs $20 per million tokens
    // console.log(`estimatedCost: ${estimatedCost}`)
    const projectedBurnRatePerMs = estimatedCost / timeSinceLastApiCall // dollars per millisecond
    const projectedBurnRatePerDay =
      projectedBurnRatePerMs * MILLISECONDS_PER_DAY
    // console.debug(`projectedBurnRate/Day: ${projectedBurnRatePerDay}, threshold: ${this.desiredBurnRatePerDay}`)
    return projectedBurnRatePerDay < this.desiredBurnRatePerDay
  }

  public async recordEmbedding(res: EmbedResult) {
    const insertVal: ApiCall = {
      datetime: res.requestTime.getTime(),
      estimatedTokens: res.estimatedTokens,
      numTokensUsed: res.numTokensUsed,
      cost: (20 * res.numTokensUsed) / 1_000_000,
      postUri: res.postUri,
      postCid: res.postCid,
      embedding: JSON.stringify(res.embedding),
    }
    await this.db
      .insertInto('api_call')
      .values([insertVal])
      .onConflict(oc => oc.doNothing())
      .execute()
    this.timeOfLastApiCall = new Date()
  }
}

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * 60
const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24
const MILLISECONDS_PER_DAY = SECONDS_PER_DAY * MILLISECONDS_PER_SECOND

type EmbedResult = {
  requestTime: Date
  estimatedTokens: number
  numTokensUsed: number
  postUri: string
  postCid: string
  embedding: number[]
}
