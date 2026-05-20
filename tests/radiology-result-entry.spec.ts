import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Radiology Results Entry & Signature Flow', () => {
  test.beforeEach(async () => {
    // Reset test order item statuses to Pending before each run to ensure test repeatability
    const bill = await prisma.bill.findUnique({
      where: { billNumber: 1018 },
      include: { orders: true }
    });
    if (bill) {
      for (const order of bill.orders) {
        await prisma.orderItem.update({
          where: { id: order.id },
          data: {
            resultStatus: 'Pending',
            resultData: null,
            resultMethod: null,
            resultDoctor: null,
            resultNotes: null,
            resultAdvice: null,
            signatureId: null
          }
        });
      }
    }
  });

  test('should successfully enter results for radiology, select department signature, and save', async ({ page }) => {
    // Intercept Cloudinary upload requests and mock a successful response
    await page.route('**/api/upload/cloudinary', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secure_url: 'https://res.cloudinary.com/dci6zeb1n/image/upload/v1779181187/mock-report.pdf'
        })
      });
    });

    // 1. Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="Enter username"]', 'IMAGEERAJANI');
    await page.fill('input[placeholder="Enter password"]', '123456');
    await page.click('button[type="submit"]');

    // Wait for successful redirection to order-entry
    await expect(page).toHaveURL(/.*order-entry/);

    // 2. Navigate to in-process bills
    await page.goto('http://localhost:3000/in-process');
    await page.waitForURL('**/in-process');

    // 3. Find the row for Bill #1018
    const billRow = page.locator('tr').filter({ hasText: '1018' });
    await expect(billRow).toBeVisible();

    // 4. Click the Orders List button to view the bill orders
    await billRow.locator('button', { hasText: 'Orders List' }).click();

    // 5. Click the Result Entry button
    const resultEntryBtn = page.locator('button', { hasText: 'Result Entry' }).first();
    await expect(resultEntryBtn).toBeVisible();
    await resultEntryBtn.click();

    // 6. Fill findings
    await page.fill('.ql-editor', 'Normal findings for X-RAY Cervical Spine. No abnormalities detected.');

    // 7. Click Save Draft
    const saveBtn = page.locator('button', { hasText: 'Save Draft' });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 8. Re-open result entry from the bill view
    await expect(resultEntryBtn).toBeVisible();
    await resultEntryBtn.click();

    // 9. Click Save & Complete
    const completeBtn = page.locator('button', { hasText: 'Save & Complete' });
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // 10. Verify order transition to completed state
    const viewResultBtn = page.locator('button', { hasText: 'View Result' }).first();
    await expect(viewResultBtn).toBeVisible();
  });
});
