import dotenv from 'dotenv'

export default class Config {
  public port: number
  public bskyFeedUri: string

  public openaiApiKey: string
  public openaiOrgId: string

  constructor() {
    dotenv.config()

    this.port = maybeInt(process.env.PORT) || 3001

    this.bskyFeedUri = check('BSKY_FEED_SERVICE')
    this.openaiApiKey = check('OPENAI_API_KEY')
    this.openaiOrgId = check('OPENAI_ORG_ID')

    console.log('env config loaded successfully!')
  }
}

function check(k: string): string {
  const v = process.env[k]
  if (!v) throw new Error(`missing env var: ${k}`)
  return v
}

function maybeInt(s: string | undefined): number | undefined {
  return s ? parseInt(s, 10) : undefined
}
