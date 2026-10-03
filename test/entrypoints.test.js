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

test('GitHub Pages visitors are redirected to the Worker that provides the API', async () => {
  const { redirectFromStaticHosting } = await import('../js/deployment.js');
  let destination;
  const redirected = redirectFromStaticHosting({
    hostname: 'psycohouse.github.io',
    pathname: '/bookassist/app.html',
    search: '?from=bookmark',
    hash: '#editor',
    replace: value => { destination = value; }
  });

  assert.equal(redirected, true);
  assert.equal(destination, 'https://bookassist.gamer-33.workers.dev/app.html?from=bookmark#editor');
  assert.equal(redirectFromStaticHosting({ hostname: 'bookassist.gamer-33.workers.dev' }), false);
});

test('the writing workspace exposes its core tools to smartphone users', async () => {
  const html = await read('app.html');
  assert.match(html, /class="mobile-nav"/);
  assert.match(html, /data-mobile-panel="chapters"/);
  assert.match(html, /data-mobile-panel="assistant"/);
  assert.match(html, /data-mobile-view="notes"/);
  assert.match(html, /id="mobile-backdrop"/);
});
