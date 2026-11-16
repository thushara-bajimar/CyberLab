import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Automated accessibility check with axe-core against WCAG 2.1 levels A and AA (contrast, labels, landmarks,
 * headings, ARIA usage, ...). Automated rules catch many but not all problems; keyboard use is checked below.
 */
// The specs share one in-memory database: leave a fresh course behind after every test in this file.
test.afterEach(async ({ request }) => {
  const response = await request.post('/api/progress/reset', { data: { confirm: 'RESET' } })
  expect(response.ok()).toBe(true)
})

const PAGES = ['/','/modules', '/modules/linux-basics', '/challenges', '/challenges/linux-hidden-files', '/challenges/fundamentals-cia-triad', '/progress', '/no-such-page']

for (const path of PAGES) {
  test(`${path} has no detectable WCAG 2.1 A/AA violations`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('main')).toBeVisible()
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const summary = results.violations.map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length} element(s) - ${violation.help}`)
    expect(summary).toEqual([])
  })
}

test('states created by learning (hints, feedback, explanation, activity, reset notice) are accessible too', async ({ page }) => {
  const scan = async (label: string) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations.map((violation) => `${label}: ${violation.id} - ${violation.help}`)).toEqual([])
  }
  await page.goto('/challenges/linux-hidden-files')
  await page.getByRole('button', { name: /Reveal hint 1 of 3/ }).click()
  await scan('hint confirmation')
  await page.getByRole('button', { name: 'Reveal hint 1', exact: true }).click()
  await page.getByLabel('Type your answer').fill('wrong')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(page.getByText(/Not quite/)).toBeVisible()
  await scan('revealed hint and wrong-answer feedback')
  await page.getByLabel('Type your answer').fill('Pa55-Lab-Only')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(page.getByRole('heading', { name: 'Solution explained' })).toBeVisible()
  await scan('completed challenge with explanation')
  await page.goto('/')
  await expect(page.getByText(/Completed: /).first()).toBeVisible()
  await scan('dashboard with activity')
  // Leave a fresh course behind for the other specs (they share the in-memory database).
  await page.goto('/progress')
  await page.getByLabel(/to confirm/).fill('RESET')
  await page.getByRole('button', { name: 'Reset all progress' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Progress reset' })).toBeVisible()
  await scan('progress page after reset')
})

test('each page has its own title and navigation moves focus to the new content', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Dashboard · CyberLab')
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Modules', exact: true }).click()
  await expect(page).toHaveTitle('Modules · CyberLab')
  await expect(page.getByRole('main')).toBeFocused()
  await page.getByRole('link', { name: 'Digital Forensics Basics' }).click()
  await expect(page).toHaveTitle('Digital Forensics Basics · CyberLab')
  await page.goto('/challenges/linux-hidden-files')
  await expect(page).toHaveTitle('Hidden Files · CyberLab')
  await page.goto('/challenges/nope')
  await expect(page).toHaveTitle('Challenge not found · CyberLab')
})

test('the main flow works with the keyboard alone', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard navigation is checked on desktop')
  await page.goto('/challenges/linux-find-note')
  // Skip link is the first focusable element and jumps to the main content.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  // The terminal input can be reached and used without a mouse.
  const input = page.getByLabel(/type a command/i)
  await input.focus()
  await page.keyboard.type('pwd')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('log', { name: 'Terminal output' })).toContainText('/home/student')
  // The answer form submits with Enter.
  const answer = page.getByLabel('Type your answer')
  await answer.focus()
  await page.keyboard.type('TUX-0000')
  await page.keyboard.press('Enter')
  await expect(page.getByText(/Not quite/)).toBeVisible()
})
