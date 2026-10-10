const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;
let server;
let browser;
let fixtureDir;

const importedDraft = {
  schema: 'pixie-draft-v1',
  pixie_id: 'test-import-001',
  title: 'Imported test title',
  link: 'https://example.org/imported',
  caption: 'Imported test caption',
  credits: 'Imported test credits',
  description: 'Imported test description',
  rights: true,
  destination: 'bluesky',
  revision: 0,
  reviewedRevision: null,
  confirmedRevision: null,
  receipts: [],
  mediaIncluded: false,
  publication: 'manual; not independently verified'
};

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Local test server did not start');
}

async function freshPage() {
  const page = await browser.newPage();
  await page.goto(baseURL + '/index.html');
  return page;
}

async function seedCurrentWork(page) {
  await page.getByRole('button', { name: /Prepare this work/ }).click();
  await page.locator('#work-title').fill('My current title');
  await page.locator('#caption').fill('My current caption');
  await page.getByRole('button', { name: /Back to my work/ }).click();
}

async function chooseImport(page, name = 'import.json', draft = importedDraft) {
  const filePath = path.join(fixtureDir, name);
  fs.writeFileSync(filePath, JSON.stringify(draft));
  await page.locator('#draft-file').setInputFiles(filePath);
}

before(async () => {
  fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pixie-import-tests-'));
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', root], { stdio: 'ignore' });
  await waitForServer();
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  if (browser) await browser.close();
  if (server) server.kill('SIGTERM');
  if (fixtureDir) fs.rmSync(fixtureDir, { recursive: true, force: true });
});

test('Keep current work cancels import without changing title or caption', async () => {
  const page = await freshPage();
  await seedCurrentWork(page);
  await chooseImport(page);
  await assert.doesNotReject(() => page.locator('#import-confirm').waitFor({ state: 'visible' }));
  await page.locator('#import-no').click();
  await page.getByRole('button', { name: /Prepare this work/ }).click();
  assert.equal(await page.locator('#work-title').inputValue(), 'My current title');
  assert.equal(await page.locator('#caption').inputValue(), 'My current caption');
  assert.match(await page.locator('#workspace-status').innerText(), /Import cancelled\. Current work retained\./);
  await page.close();
});

test('Replace restores imported text and leaves media/review to be selected again', async () => {
  const page = await freshPage();
  await seedCurrentWork(page);
  await chooseImport(page);
  await page.locator('#import-yes').click();
  await page.getByRole('button', { name: /Prepare this work/ }).click();
  assert.equal(await page.locator('#work-title').inputValue(), importedDraft.title);
  assert.equal(await page.locator('#caption').inputValue(), importedDraft.caption);
  assert.equal(await page.locator('#credits').inputValue(), importedDraft.credits);
  assert.equal(await page.locator('#description').inputValue(), importedDraft.description);
  assert.match(await page.locator('#workspace-status').innerText(), /Draft restored\. Select media separately and review again\./);
  assert.equal(await page.locator('#media-status').innerText(), 'No media selected.');
  await page.close();
});

test('editing while a slow import is being read invalidates the stale import', async () => {
  const page = await freshPage();
  await seedCurrentWork(page);
  await page.evaluate(() => {
    const originalText = File.prototype.text;
    File.prototype.text = function () {
      if (this.name !== 'slow.json') return originalText.call(this);
      return new Promise(resolve => {
        window.__releaseSlowImport = () => originalText.call(this).then(resolve);
      });
    };
  });
  await chooseImport(page, 'slow.json');
  await page.waitForFunction(() => typeof window.__releaseSlowImport === 'function');
  await page.getByRole('button', { name: /Prepare this work/ }).click();
  await page.locator('#work-title').fill('Newer work must win');
  await page.evaluate(() => window.__releaseSlowImport());
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#work-title').inputValue(), 'Newer work must win');
  assert.equal(await page.locator('#caption').inputValue(), 'My current caption');
  assert.equal(await page.locator('#import-confirm').isVisible(), false);
  assert.match(await page.locator('#workspace-status').innerText(), /Draft changed\. Review again before sharing\./);
  await page.close();
});
