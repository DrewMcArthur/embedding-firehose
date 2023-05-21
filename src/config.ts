import dotenv from 'dotenv'

export default class Config {
    public port: number
    public sqliteLocation: string
    public bskyFeedUri: string

    public openaiApiKey: string
    public openaiOrgId: string

    constructor() {
        dotenv.config()

        this.port = maybeInt(process.env.PORT) || 3001
        this.sqliteLocation = process.env.SQLITE_LOCATION!
        this.bskyFeedUri = process.env.BSKY_FEED_SERVICE!
        this.openaiApiKey = process.env.OPENAI_API_KEY!
        this.openaiOrgId = process.env.OPENAI_ORG_ID!
    }
}

function maybeInt(s: string | undefined): number | undefined {
    return s ? parseInt(s, 10) : undefined;
}