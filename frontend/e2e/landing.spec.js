import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('renders hero section with slogan', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('가르친 것과 배운 것 사이의')
    await expect(page.locator('h1')).toContainText('간격을 AI가 찾는다')
  })

  test('displays 3 feature cards', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('.grid.md\\:grid-cols-3 a')
    await expect(cards).toHaveCount(3)
  })

  test('CTA button navigates to analyze page', async ({ page }) => {
    await page.goto('/')
    await page.click('text=분석 시작하기')
    await expect(page).toHaveURL(/\/analyze/)
    await expect(page.locator('h2')).toContainText('Learning Gap Analysis')
  })

  test('feature card navigates to predict page', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/predict"]')
    await expect(page).toHaveURL(/\/predict/)
    await expect(page.locator('h2')).toContainText('Struggle Predictor')
  })
})
