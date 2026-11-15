import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { GUEST_USER_ID, SCHEMA_SQL, SCHEMA_VERSION } from './schema.js'

export type DB = Database.Database

/**
 * Opens (creating if needed) the SQLite database, enables safety pragmas, creates the schema and makes sure
 * the guest learner profile exists. Pass ':memory:' for a throwaway database in tests.
 */
export function openDatabase(databasePath: string): DB {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true })
  }
  const db = new Database(databasePath)
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  if (databasePath !== ':memory:') {
    db.pragma('journal_mode = WAL')
  }

  db.transaction(() => {
    db.exec(SCHEMA_SQL)
    db.pragma(`user_version = ${SCHEMA_VERSION}`)
    db.prepare('INSERT OR IGNORE INTO users (id, display_name, created_at) VALUES (?, ?, ?)').run(
      GUEST_USER_ID,
      'Learner',
      new Date().toISOString(),
    )
  })()
  return db
}

/** Lightweight check used by the health endpoint. */
export function checkDatabase(db: DB): { ok: true; schemaVersion: number } {
  db.prepare('SELECT 1').get()
  return { ok: true, schemaVersion: Number(db.pragma('user_version', { simple: true })) }
}
