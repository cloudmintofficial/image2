const { chromium } = require('playwright');

(async () => {

  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto(
    'https://medfileshared2.bharathcloud.com/lab'
  );

  // Fill username
  await page.fill(
    'input[type="text"]',
    'Imagee owner'
  );

  // Fill password
  await page.fill(
    'input[type="password"]',
    'gagan1112'
  );

  // Click login button
  await page.click('button');

  // Wait
  await page.waitForTimeout(5000);

  await page.pause();

})();