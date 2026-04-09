import { test, expect } from '@playwright/test'

test.describe('Optimize Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/optimize')
  })

  test('renders page title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Curriculum Optimizer')
  })

  test('displays sample gap data', async ({ page }) => {
    await expect(page.locator('text=데이터 전처리')).toBeVisible()
    await expect(page.locator('text=모델 평가 지표')).toBeVisible()
    await expect(page.locator('text=신경망 기초')).toBeVisible()
  })

  test('coverage and hours inputs are editable', async ({ page }) => {
    const coverageInput = page.locator('input[type="number"]').first()
    await coverageInput.fill('70')
    await expect(coverageInput).toHaveValue('70')

    const hoursInput = page.locator('input[type="number"]').nth(1)
    await hoursInput.fill('24')
    await expect(hoursInput).toHaveValue('24')
  })

  test('optimize button is visible and enabled', async ({ page }) => {
    const button = page.locator('button', { hasText: '커리큘럼 최적화' })
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
  })
})
