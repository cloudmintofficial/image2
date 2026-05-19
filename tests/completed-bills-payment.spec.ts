import { test, expect } from '@playwright/test';

test.describe('Completed Bills Payment Flow', () => {
  test('should successfully log in, view completed bills, and process payments', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('http://localhost:3000/login');
    
    // Expect login page title or logo text
    await expect(page.locator('h1')).toContainText('Medfile Labs');

    // 2. Perform Login
    await page.fill('input[placeholder="Enter username"]', 'Imagee owner');
    await page.fill('input[placeholder="Enter password"]', 'gagan1112');
    
    // Click submit/login button
    await page.click('button[type="submit"]');

    // 3. Verify successful redirection to order-entry
    await expect(page).toHaveURL(/.*order-entry/);
    
    // 4. Navigate to Completed Bills page
    await page.goto('http://localhost:3000/completed-bills');
    
    // Verify Completed Bills header is visible
    await expect(page.locator('h1.page-title')).toContainText('Completed Bills');

    // Wait for the table to load
    await page.waitForSelector('table.data-table');

    // Locate the row for Bill #1013
    const billRow = page.locator('tr').filter({ hasText: '1013' });
    await expect(billRow).toBeVisible();

    // Verify it shows the "Bill Payment" button because it has a balance
    const paymentButton = billRow.locator('button', { hasText: 'Bill Payment' });
    await expect(paymentButton).toBeVisible();
    await expect(paymentButton).toBeEnabled();

    // 5. Click "Bill Payment" to open the modal
    await paymentButton.click();

    // Verify modal title
    const modalHeader = page.locator('.modal-header h3');
    await expect(modalHeader).toContainText('Bill Payment — #1013');

    // Verify bill totals inside the modal
    await expect(page.locator('.modal-body')).toContainText('Balance:');
    
    // Enter a partial payment amount (e.g., 250)
    const amountInput = page.locator('input[type="number"]').nth(1); // the active input for amount paid now
    await amountInput.fill('250');

    // Choose payment method (e.g., UPI)
    await page.selectOption('select.form-select', 'UPI');

    // Set up dialog listener to handle the "Payment submitted successfully" alert popup
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Payment submitted successfully');
      await dialog.accept();
    });

    // Click submit in the modal
    await page.click('.modal-footer button.btn-primary');

    // Wait for modal to close (be hidden)
    await expect(page.locator('.modal-overlay')).toBeHidden();

    // Verify the balance is updated in the row
    await expect(billRow).toContainText('200'); // the remaining balance should be 200

    // 6. Click "Bill Payment" again to pay the remaining balance
    await paymentButton.click();
    await expect(modalHeader).toContainText('Bill Payment — #1013');
    
    // Fill the remaining amount 200
    await amountInput.fill('200');
    
    // Set up dialog listener for the second successful payment
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Payment submitted successfully');
      await dialog.accept();
    });

    // Click submit
    await page.click('.modal-footer button.btn-primary');

    // Wait for modal to close
    await expect(page.locator('.modal-overlay')).toBeHidden();

    // 7. Verify the button has transitioned to "Paid" (disabled)
    const paidButton = billRow.locator('button', { hasText: 'Paid' });
    await expect(paidButton).toBeVisible();
    await expect(paidButton).toBeDisabled();
  });
});
