const encoder = new TextEncoder();
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const fromB64 = value => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
const equal = (a, b) => { if (a.length !== b.length) return false; let result = 0; for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i]; return result === 0; };
async function hmac(value, secret) { const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return b64url(await crypto.subtle.sign('HMAC', key, encoder.encode(value))); }
async function makeSession(secret) { const payload = b64url(encoder.encode(JSON.stringify({ exp: Date.now() + 7 * 864e5, nonce: crypto.randomUUID() }))); return `${payload}.${await hmac(payload, secret)}`; }
async function validSession(request, secret) {
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)story_session=([^;]+)/)?.[1]; if (!token || !secret) return false;
  const [payload, signature] = token.split('.'); if (!payload || !signature || !equal(encoder.encode(await hmac(payload, secret)), encoder.encode(signature))) return false;
  try { return JSON.parse(new TextDecoder().decode(fromB64(payload))).exp > Date.now(); } catch { return false; }
}
function verifyPassword(password, stored) {
  if (!stored) return false;
  return equal(encoder.encode(password), encoder.encode(stored));
}
function systemPrompt(context) { return `Du bist der persönliche Buch-Schreibassistent des Autors. Unterstütze beim Schreiben, Brainstorming, Strukturieren, bei Figuren und dem roten Faden. Übernimm das Buch niemals ungefragt. Unterscheide etablierte Manuskript-Fakten, Ideen des Autors und deine Vorschläge. Erfinde keine bestehenden Story-Fakten; kennzeichne fehlende Informationen und Vorschläge. Antworte auf Deutsch.\n\nRelevanter Projektkontext:\n${JSON.stringify(context)}`; }

export default { async fetch(request, env) {
  const url = new URL(request.url); if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  if (url.pathname === '/api/login' && request.method === 'POST') {
    if (!env.APP_USERNAME || !env.APP_PASSWORD || !env.SESSION_SECRET) return json({ error: 'Anmeldung ist nicht konfiguriert' }, 503);
    let body; try { body = await request.json(); } catch { return json({ error: 'Ungültige Anfrage' }, 400); }
    if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.password.length > 1024 || body.username !== env.APP_USERNAME || !verifyPassword(body.password, env.APP_PASSWORD)) return json({ error: 'Anmeldung fehlgeschlagen' }, 401);
    const session = await makeSession(env.SESSION_SECRET); return json({ ok: true }, 200, { 'set-cookie': `story_session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800` });
  }
  if (url.pathname === '/api/logout' && request.method === 'POST') return json({ ok: true }, 200, { 'set-cookie': 'story_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0' });
  if (!(await validSession(request, env.SESSION_SECRET))) return json({ error: 'Nicht angemeldet' }, 401);
  if (url.pathname === '/api/session' && request.method === 'GET') return json({ authenticated: true });
  if (url.pathname === '/api/ai' && request.method === 'POST') {
    if (!env.OPENAI_API_KEY) return json({ error: 'AI ist nicht konfiguriert' }, 503);
    let body; try { body = await request.json(); } catch { return json({ error: 'Ungültige Anfrage' }, 400); }
    if (typeof body.message !== 'string' || body.message.length > 10000 || JSON.stringify(body.projectContext || {}).length > 80000) return json({ error: 'Anfrage ist zu groß oder ungültig' }, 400);
    const instructions = systemPrompt(body.projectContext || {});
    const prompt = `Aktion: ${body.action || 'chat'}\nAnfrage: ${body.message}\n${body.selectedText ? `Markierter Text:\n${body.selectedText}` : ''}`;
    try {
      const upstream = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: env.OPENAI_MODEL || 'gpt-5-mini', instructions, input: prompt, max_output_tokens: 1800 }) });
      if (!upstream.ok) { console.error('OpenAI request failed', upstream.status); return json({ error: 'AI momentan nicht erreichbar' }, 502); }
      const result = await upstream.json(); const answer = result.output_text || result.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
      if (!answer) return json({ error: 'Leere AI-Antwort' }, 502); return json({ answer });
    } catch (error) { console.error('OpenAI network error', error); return json({ error: 'AI momentan nicht erreichbar' }, 502); }
  }
  return json({ error: 'Nicht gefunden' }, 404);
} };
