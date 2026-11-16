import { createApp } from './app.js'
import { isLoopback, loadConfig } from './config.js'
import { challenges, modules } from './content/index.js'
import { openDatabase } from './db/connection.js'
import { seedContent } from './db/seed.js'

const config = loadConfig()
const db = openDatabase(config.databasePath)
seedContent(db, modules, challenges)
const app = createApp({ db, allowedHosts: config.allowedHosts })

const server = app.listen(config.port, config.host, () => {
  console.log(`CyberLab API listening on http://${config.host}:${config.port}`)
  console.log(`Database: ${config.databasePath}`)
  if (!isLoopback(config.host)) {
    console.warn(
      `WARNING: HOST=${config.host} makes the API reachable from other computers. CyberLab has no login: ` +
        'anyone who can reach it can read and reset progress. Use 127.0.0.1 unless you understand the risk.',
    )
  }
})

function shutdown(signal: string) {
  console.log(`${signal} received, closing server and database.`)
  server.close(() => {
    db.close()
    process.exit(0)
  })
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
