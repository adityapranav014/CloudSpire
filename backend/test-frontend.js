import puppeteer from 'puppeteer';

const pages = [
  '/',
  '/signup',
  '/onboarding',
  '/dashboard',
  '/cost-explorer',
  '/anomalies',
  '/optimizer',
  '/teams',
  '/reports',
  '/settings'
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  for (const p of pages) {
    const url = `http://localhost:5173${p}`;
    console.log(`\nTesting ${url}`);
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[ERROR] ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      console.log(`[PAGE_ERROR] ${err.message}`);
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 5000 });
      console.log(`Loaded ${p}`);
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 100));
      console.log(`Data visible (snippet): ${bodyText.replace(/\n/g, ' ')}`);
    } catch (err) {
      console.log(`[NAVIGATION_ERROR] ${err.message}`);
    }
    
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }

  await browser.close();
})();
