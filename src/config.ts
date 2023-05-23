import dotenv from 'dotenv'

export default class Config {
  public port: number
  public bskyFeedUri: string
  public sampleRate: number | undefined

  public openaiApiKey: string
  public openaiOrgId: string

  public dbLocation: string
  public desiredBurnRatePerDay: number

  constructor() {
    dotenv.config()

    this.port = maybeInt(process.env.PORT) || 3001
    this.sampleRate = maybeFloat(process.env.SAMPLE_RATE) || 0.1

    this.bskyFeedUri = check('BSKY_FEED_SERVICE')
    this.openaiApiKey = check('OPENAI_API_KEY')
    this.openaiOrgId = check('OPENAI_ORG_ID')

    this.dbLocation = check('DB_LOCATION', ':memory:')
    this.desiredBurnRatePerDay =
      maybeInt(process.env.DESIRED_BURN_RATE_PER_DAY) || 1

    console.log('env config loaded successfully!')
  }
}

function check(k: string, def: string | undefined = undefined): string {
  const v = process.env[k]
  const r = v || def
  if (!r) throw new Error(`missing env var: ${k}, no default provided`)
  return r
}

function maybeInt(s: string | undefined): number | undefined {
  return s ? parseInt(s, 10) : undefined
}

function maybeFloat(s: string | undefined): number | undefined {
  return s ? parseFloat(s) : undefined
}
