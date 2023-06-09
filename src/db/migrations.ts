import { Kysely, Migration, MigrationProvider } from 'kysely'

const migrations: Record<string, Migration> = {}

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('api_call')
      .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
      .addColumn('datetime', 'timestamp', col => col.notNull())
      .addColumn('estimatedTokens', 'integer', col => col.notNull())
      .addColumn('numTokensUsed', 'integer', col => col.notNull())
      .addColumn('cost', 'decimal(2, 20)', col => col.notNull())
      .addColumn('postUri', 'varchar', col => col.notNull())
      .addColumn('postCid', 'varchar', col => col.notNull())
      .addColumn('embedding', 'json', col => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('api_call').execute()
  },
}
