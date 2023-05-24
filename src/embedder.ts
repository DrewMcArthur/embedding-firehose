import { WordTokenizer } from 'natural'
import { Configuration, OpenAIApi } from 'openai'
import Config from './config'
import CostLimiter from './cost-limiter'

// a class handling embedding post contents
export default class Embedder {
  tokenizer: WordTokenizer
  openai: OpenAIApi
  dryRun: boolean

  constructor(config: Config) {
    this.tokenizer = new WordTokenizer()
    this.openai = this._initOpenAI(config)
    this.dryRun = config.dryRun
  }

  private _initOpenAI(config: Config): OpenAIApi {
    return new OpenAIApi(
      new Configuration({
        apiKey: config.openaiApiKey,
        organization: config.openaiOrgId,
      }),
    )
  }

  async embed(tokens: string[]): Promise<EmbedResponse> {
    if (this.dryRun) return { embedding: [], numTokensUsed: 0 }
    const response = await this.openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: tokens.join(' '),
    })

    return {
      embedding: response.data.data[0].embedding,
      numTokensUsed: response.data.usage.total_tokens,
    }
  }

  tokenize(s: string): string[] {
    s = s.replace(/https?:\/\/[^\s]+/g, '').toLowerCase()
    const tokens = this.tokenizer.tokenize(s)
    if (tokens === null) {
      throw new Error(`Tokenizer failed on string: ${s}`)
    }

    return tokens.filter(t => !/^[@#]|^(rt|fv)$/i.test(t))
  }
}

export type EmbedResponse = {
  embedding: number[]
  numTokensUsed: number
}
