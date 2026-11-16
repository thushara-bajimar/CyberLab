import { expect, test } from '@playwright/test'

/** Every page renders without browser errors and without horizontal scrolling, on desktop and on a phone. */
const PAGES = ['/', '/modules', '/modules/forensics', '/challenges', '/challenges/forensics-find-script', '/challenges/fundamentals-cia-triad', '/progress']

for (const path of PAGES) {
  test(`${path} renders cleanly`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.goto(path)
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Server online' })).toBeVisible()
    await page.waitForLoadState('networkidle')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(0)
    expect(errors).toEqual([])
  })
}

test('unknown pages show a friendly 404', async ({ page }) => {
  await page.goto('/challenges/does-not-exist')
  await expect(page.getByRole('heading', { name: 'Challenge not found' })).toBeVisible()
  await page.goto('/no-such-page')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})
