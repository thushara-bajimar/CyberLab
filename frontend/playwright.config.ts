import { defineConfig } from '@playwright/test'

/**
 * End-to-end tests: a real browser against the real backend and frontend.
 *
 * Playwright starts its own servers on ports 4100 (API) and 5174 (web) with an in-memory SQLite database, so
 * every run starts from a fresh course, nothing is written to disk, and a developer's `npm run dev`
 * (ports 4000/5173) is never touched. The installed Microsoft Edge is used by default; set
 * PLAYWRIGHT_CHANNEL=chrome (or run `npx playwright install chromium` and set it to "chromium") to change it.
 */
const API_PORT = 4100
const WEB_PORT = 5174
const channel = process.env.PLAYWRIGHT_CHANNEL ?? 'msedge'

export default defineConfig({
  testDir: 'e2e',
  workers: 1, // one shared in-memory database: run specs one after another
  fullyParallel: false,
  timeout: 30_000,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    channel: channel === 'chromium' ? undefined : channel,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    {
      command: 'node --import tsx src/index.ts',
      cwd: '../backend',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      env: { PORT: String(API_PORT), DATABASE_PATH: ':memory:' },
      reuseExistingServer: false,
    },
    {
      command: `node node_modules/vite/bin/vite.js --port ${WEB_PORT}`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      env: { CYBERLAB_API_URL: `http://127.0.0.1:${API_PORT}` },
      reuseExistingServer: false,
    },
  ],
})
