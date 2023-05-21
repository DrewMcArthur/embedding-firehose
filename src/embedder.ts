import { WordTokenizer } from 'natural'
import { Configuration, OpenAIApi } from 'openai'
import Config from './config'

// a class handling embedding post contents
export default class Embedder {
    tokenizer: WordTokenizer
    openai: OpenAIApi

    constructor(config: Config) {
        this.tokenizer = new WordTokenizer()
        this.openai = this._initOpenAI(config)
    }

    private _initOpenAI(config: Config): OpenAIApi {
        return new OpenAIApi(
            new Configuration({
                apiKey: config.openaiApiKey,
                organization: config.openaiOrgId
            })
        );
    }

    async embed(content: string): Promise<number[]> {
        const processed = this.preprocess(content)
        const response = await this.openai.createEmbedding({
            model: "text-embedding-ada-002",
            input: processed,
        });

        const embedding: number[] = response.data.data[0].embedding;
        return embedding
    }

    private preprocess(content: string): string {
        content = content.replace(/https?:\/\/[^\s]+/g, '')
        content = this.tokenize(content).join(" ")
        return content.toLowerCase()
    }

    private tokenize(s: string): string[] {
        const tokens = this.tokenizer.tokenize(s)
        if (tokens === null) {
            throw new Error(`Tokenizer failed on string: ${s}`)
        }

        return tokens.filter(t => !/^[@#]|^(rt|fv)$/i.test(t))
    }
}