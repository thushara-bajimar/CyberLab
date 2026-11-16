import { expect, test, type Page } from '@playwright/test'

/**
 * One complete learner journey through the real application. The steps depend on each other (shared
 * database), so they run in order; the run ends with a reset, leaving a fresh course behind.
 */
test.describe.configure({ mode: 'serial' })
test.skip(({ isMobile }) => isMobile, 'The journey runs on desktop; mobile layout is covered by responsive.spec.ts')

async function terminal(page: Page, command: string) {
  const input = page.getByLabel(/type a command/i)
  await input.fill(command)
  await input.press('Enter')
  await expect(input).toHaveValue('')
}

test('a new learner sees an empty dashboard with real course totals', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Welcome, Learner' })).toBeVisible()
  const stats = page.getByLabel('Your statistics')
  await expect(stats).toContainText('14')
  await expect(stats).toContainText('of 1900 possible')
  await expect(stats).toContainText('0%')
  await expect(page.getByText('No activity yet')).toBeVisible()
})

test('a multiple-choice challenge can be completed from the recommendation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Start challenge/ }).click()
  await expect(page.getByRole('heading', { name: 'The CIA Triad in Practice' })).toBeVisible()
  await page.getByLabel(/Availability/).check()
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(page.getByText('Correct! You earned all 100 points.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Solution explained' })).toBeVisible()
})

test('a terminal challenge: investigate, use a hint, answer wrongly, then correctly', async ({ page }) => {
  await page.goto('/challenges/linux-hidden-files')
  const log = page.getByRole('log', { name: 'Terminal output' })

  await terminal(page, 'ls webapp')
  await expect(log).not.toContainText('.env.backup')
  await terminal(page, 'ls -a webapp')
  await expect(log).toContainText('.env.backup')
  await terminal(page, 'cat webapp/.env.backup')
  await expect(log).toContainText('DB_PASSWORD=Pa55-Lab-Only')
  await terminal(page, 'rm -rf /')
  await expect(log).toContainText('read-only')
  await terminal(page, 'cat /etc/passwd; whoami')
  await expect(log).toContainText('one command at a time')

  await page.getByRole('button', { name: /Reveal hint 1 of 3/ }).click()
  await expect(page.getByRole('alertdialog')).toContainText('worth 90 points instead of 100')
  await page.getByRole('button', { name: 'Reveal hint 1', exact: true }).click()
  await expect(page.getByText('Hint 1', { exact: true })).toBeVisible()
  await expect(page.getByText('90 pts available')).toBeVisible()

  const answer = page.getByLabel('Type your answer')
  await answer.fill('DB_PASSWORD=Pa55-Lab-Only')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(page.getByText(/Not quite\. .*\(Attempt 1\.\)/)).toBeVisible()
  await answer.fill('pa55-lab-only')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(page.getByText('Correct! You earned 90 of 100 points (1 hint used).')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Solution explained' })).toBeVisible()
  await expect(log).toContainText('DB_PASSWORD=Pa55-Lab-Only') // terminal session survived the update
})

test('the dashboard and progress page show the stored progress', async ({ page }) => {
  await page.goto('/')
  const stats = page.getByLabel('Your statistics')
  await expect(stats).toContainText('190')
  await expect(page.getByText('Completed: ').first()).toBeVisible()

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Progress', exact: true }).click()
  const summary = page.getByLabel('Progress summary')
  await expect(summary).toContainText('2/14')
  await expect(summary).toContainText('190')
  await expect(page.getByRole('row', { name: /Hidden Files/ })).toContainText('90/100')
})

test('progress can be reset only after typing RESET', async ({ page }) => {
  await page.goto('/progress')
  const button = page.getByRole('button', { name: 'Reset all progress' })
  await expect(button).toBeDisabled()
  await page.getByLabel(/to confirm/).fill('reset')
  await expect(button).toBeDisabled()
  await page.getByLabel(/to confirm/).fill('RESET')
  await button.click()
  await expect(page.getByRole('status').filter({ hasText: 'Progress reset' })).toContainText('2 challenge record(s)')
  await expect(page.getByLabel('Progress summary')).toContainText('0/14')
})
