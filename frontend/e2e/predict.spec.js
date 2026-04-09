import { test, expect } from '@playwright/test'

test.describe('Predict Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/predict')
  })

  test('renders page title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Struggle Predictor')
  })

  test('sample data button is visible and enabled', async ({ page }) => {
    const button = page.locator('button', { hasText: '샘플 데이터로 테스트' })
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
  })

  test('JSON input section is collapsed by default', async ({ page }) => {
    const textarea = page.locator('textarea')
    await expect(textarea).not.toBeVisible()
  })

  test('JSON input section expands on click', async ({ page }) => {
    await page.click('text=JSON 직접 입력')
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
  })

  test('JSON submit button is disabled when textarea is empty', async ({ page }) => {
    await page.click('text=JSON 직접 입력')
    const jsonButton = page.locator('button', { hasText: 'JSON으로 분석' })
    await expect(jsonButton).toBeDisabled()
  })
})
