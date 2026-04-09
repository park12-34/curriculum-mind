import { test, expect } from '@playwright/test'

test.describe('Analyze Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analyze')
  })

  test('renders page title and description', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Learning Gap Analysis')
    await expect(page.locator('text=커리큘럼 PDF와 평가 데이터를 업로드하면')).toBeVisible()
  })

  test('displays two file drop zones', async ({ page }) => {
    await expect(page.getByText('커리큘럼 PDF', { exact: true })).toBeVisible()
    await expect(page.getByText('평가 데이터 (PDF / CSV)')).toBeVisible()
  })

  test('submit button is disabled without files', async ({ page }) => {
    const button = page.locator('button[type="submit"]')
    await expect(button).toBeDisabled()
  })

  test('navigation works from analyze to other pages', async ({ page }) => {
    await page.click('text=Struggle Predictor')
    await expect(page).toHaveURL(/\/predict/)

    await page.click('text=Curriculum Optimizer')
    await expect(page).toHaveURL(/\/optimize/)
  })

  test('logo links back to landing page', async ({ page }) => {
    await page.click('text=CurriculumMind')
    await expect(page).toHaveURL('/')
  })
})
