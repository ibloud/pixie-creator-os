const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

test('artist sharing is visibly unavailable and forced handlers cannot copy, download or open a service', async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.route('http://pixie.test/**', route => {
      const file = path.resolve(__dirname, '..', new URL(route.request().url()).pathname.slice(1) || 'index.html');
      const ext = path.extname(file), mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
      if (!file.startsWith(path.resolve(__dirname, '..') + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ body: fs.readFileSync(file), contentType: mime[ext] || 'application/octet-stream' });
    });
    await page.route('https://**/*', route => route.abort());
    let downloads = 0, popups = 0;
    page.on('download', () => downloads++); page.on('popup', () => popups++);
    await page.addInitScript(() => { window.copyAttempts = 0; Object.defineProperty(navigator, 'clipboard', {value: {writeText: async () => {window.copyAttempts++;}}}); });
    await page.goto('http://pixie.test/#prepare');
    await page.locator('#work-title').fill('Original synthetic draft');
    await page.locator('#work-link').fill('https://example.org/original');
    await page.locator('#credits').fill('Synthetic fixture; creator declaration only');
    await page.locator('#description').fill('Synthetic accessibility description');
    await page.locator('#rights').check();
    await page.locator('button[data-go="share"]').click();
    await page.locator('#review').click(); await page.locator('#confirm').click();
    assert.match(await page.locator('#clearance-status').innerText(), /unavailable pending clearance verification/);
    for (const id of ['copy-text','copy-description','download-text','download-media']) {
      assert.equal(await page.locator('#'+id).isDisabled(), true, id);
      await page.locator('#'+id).dispatchEvent('click');
    }
    assert.equal(await page.locator('#open-destination').getAttribute('href'), null);
    assert.equal(await page.locator('#open-destination').getAttribute('aria-disabled'), 'true');
    await page.locator('#open-destination').focus(); await page.keyboard.press('Enter');
    assert.match(await page.locator('#workspace-status').innerText(), /clearance verification/);
    assert.equal(await page.evaluate(() => window.copyAttempts), 0);
    assert.equal(downloads, 0); assert.equal(popups, 0);
    // Private backup remains usable, preserving original work rather than discarding it.
    await page.locator('button[data-view="work"]').click();
    const downloaded = page.waitForEvent('download'); await page.locator('#download-draft').click(); await downloaded;
    assert.equal(downloads, 1);
    for (const width of [320,768,1024,1440]) {
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'reflow '+width);
    }
  } finally { await browser.close(); }
});
