import Config from './config'
import { Database } from './db'
import { ApiCall } from './db/schema'

/// keeps track of the openai API usage over time, to stay below a certain $/day burn rate
export default class CostLimiter {
  private timeOfLastApiCall: Date
  private desiredBurnRatePerDay: number
  private db: Database
  private minTokensToEmbed: number

  constructor(config: Config, db: Database) {
    this.db = db
    this.desiredBurnRatePerDay = config.desiredBurnRatePerDay
    this.timeOfLastApiCall = new Date()
    this.minTokensToEmbed = config.minTokensToEmbed
  }

  /**
   * Determines whether to embed or not based on
   * the number of tokens, the desired burn rate,
   * and the amount of time since the last embedding api call.
   *
   * @param {number} numTokens - the number of tokens to be embedded
   * @return {boolean} true if projected burn rate is below the threshold
   *                   && numTokens is above minTokensToEmbed
   */
  public shouldEmbed(numTokens: number): boolean {
    if (numTokens < this.minTokensToEmbed) return false
    const timeSinceLastApiCall =
      new Date().getTime() - this.timeOfLastApiCall.getTime()

    // openai.createEmbedding costs $20 per million tokens
    const estimatedCost = (20 * numTokens) / 1_000_000
    const projectedBurnRatePerMs = estimatedCost / timeSinceLastApiCall
    const projectedBurnRatePerDay =
      projectedBurnRatePerMs * MILLISECONDS_PER_DAY
    return projectedBurnRatePerDay < this.desiredBurnRatePerDay
  }

  /**
   * Records an embedding in the database along with relevant metadata,
   * and resets the burn rate clock
   *
   * @param {EmbedResult} res - The embedding and associated metadata to record.
   * @return {Promise<void>} A Promise that resolves when the embedding has been recorded.
   */
  public async recordEmbedding(res: EmbedResult): Promise<void> {
    const now = new Date()
    const insertVal: ApiCall = {
      datetime: now.getTime(),
      estimatedTokens: res.estimatedTokens,
      numTokensUsed: res.numTokensUsed,
      cost: (20 * res.numTokensUsed) / 1_000_000,
      postUri: res.postUri,
      postCid: res.postCid,
      embedding: JSON.stringify(res.embedding),
    }
    return new Promise<void>((resolve, reject) => {
      this.db
        .insertInto('api_call')
        .values([insertVal])
        .onConflict(oc => oc.doNothing())
        .execute()
        .catch(e => reject(console.error(`error recording api call: ${e}`)))
        .then(() => {
          this.timeOfLastApiCall = now
          resolve()
        })
    })
  }
}

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * 60
const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24
const MILLISECONDS_PER_DAY = SECONDS_PER_DAY * MILLISECONDS_PER_SECOND

type EmbedResult = {
  estimatedTokens: number
  numTokensUsed: number
  postUri: string
  postCid: string
  embedding: number[]
}
