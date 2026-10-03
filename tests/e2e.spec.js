import { test, expect } from '@playwright/test';

test('ProductSense smoke test', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ProductSense' })).toBeVisible();
  await page.getByRole('button', { name: 'Customer Feedback' }).click();
  await page.getByRole('textbox', { name: 'Customer' }).fill('Test Customer');
  await page.getByRole('textbox', { name: 'Title' }).fill('User onboarding is confusing');
  await page.getByRole('textbox', { name: 'Description' }).fill('The task flow is hard to understand at first use.');
  await page.getByRole('button', { name: 'Add feedback' }).click();
  await expect(page.getByText('Feedback added successfully.')).toBeVisible();
});
