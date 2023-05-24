import Config from '../config'
import CostLimiter from '../cost-limiter'
import { createDb } from '../db'

describe(CostLimiter.name, () => {
  let testConfig = new Config()
  testConfig.dbLocation = ':memory:'
  testConfig.desiredBurnRatePerDay = 25
  let db = createDb(testConfig.dbLocation)
  it('should wait to embed until burn rate under 1', async () => {
    const costLimiter = new CostLimiter(testConfig, db)
    let apiCalls = 0

    for (let i = 0; i < 10; i++) {
      await delay(100)
      if (costLimiter.shouldEmbed(10)) {
        apiCalls++
      }
    }

    expect(apiCalls).toEqual(4)
  })
})

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
