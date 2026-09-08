// Script to take screenshot of portal
(async () => {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
    await browser.close();
    console.log('Screenshot captured successfully.');
  } catch (err) {
    console.log('Note:', err.message);
  }
})();
