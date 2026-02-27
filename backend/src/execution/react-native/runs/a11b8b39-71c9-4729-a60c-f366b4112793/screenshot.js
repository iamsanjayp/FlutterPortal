
const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    
    // Load local file
    await page.goto('file:///app/dist/index.html', { waitUntil: 'networkidle0' });
    
    // Wait a bit for any animations or mounting
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: '/app/output.png', type: 'png' });
    await browser.close();
    console.log('Screenshot saved');
  } catch (err) {
    console.error('Screenshot failed:', err);
    process.exit(1);
  }
})();
