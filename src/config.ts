import dotenv from 'dotenv'

export default class Config {
  public wssPort: number
  public port: number
  public bskyFeedUri: string
  public sampleRate: number | undefined

  public openaiApiKey: string | undefined
  public openaiOrgId: string | undefined

  public dbLocation: string
  public desiredBurnRatePerDay: number

  public dryRun: boolean
  public minTokensToEmbed: number

  public ssl: SslConfig | undefined
  public useHttps: boolean

  constructor() {
    dotenv.config()

    this.wssPort = maybeInt(process.env.WSS_PORT) || 3000
    this.port = maybeInt(process.env.PORT) || 8080
    this.sampleRate = maybeFloat(process.env.SAMPLE_RATE) || 0.1

    this.bskyFeedUri = check('BSKY_FEED_SERVICE', 'wss://bsky.social')

    this.dbLocation = check('DB_LOCATION', ':memory:')
    this.desiredBurnRatePerDay =
      maybeInt(process.env.DESIRED_BURN_RATE_PER_DAY) || 1

    this.minTokensToEmbed = maybeInt(process.env.MIN_TOKENS_TO_EMBED) || 1
    this.dryRun = check('DRY_RUN', 'true').toLowerCase() !== 'false'

    if (!this.dryRun) {
      this.openaiApiKey = check('OPENAI_API_KEY')
      this.openaiOrgId = check('OPENAI_ORG_ID')
    }

    this.useHttps = check('USE_HTTPS', 'false').toLowerCase() !== 'false'
    if (this.useHttps) {
      this.ssl = {
        keyPath: check('SSL_KEY_PATH'),
        certPath: check('SSL_CERT_PATH'),
      }
    }

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

type SslConfig = {
  keyPath: string
  certPath: string
}
