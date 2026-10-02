import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the root document is the styled login page', async () => {
  const html = await read('index.html');
  assert.match(html, /id="login-form"/);
  assert.match(html, /href="css\/login\.css"/);
  assert.match(html, /src="js\/auth\.js"/);
});

test('the authenticated writing app has its own styled entry point', async () => {
  const html = await read('app.html');
  assert.match(html, /id="dashboard"/);
  assert.match(html, /href="css\/app\.css"/);
  assert.match(html, /src="js\/app\.js"/);
});
