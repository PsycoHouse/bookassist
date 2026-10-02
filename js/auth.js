const form = document.querySelector('#login-form');
try {
  const status = await fetch('/api/session');
  if (status.ok) location.replace('app.html');
} catch { /* The form displays connection errors when submitted. */ }
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const error = document.querySelector('#error');
  error.textContent = '';
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    if (!response.ok) throw new Error(response.status === 401 ? 'Benutzername oder Passwort ist nicht richtig.' : 'Anmeldung ist momentan nicht möglich.');
    location.replace('app.html');
  } catch (cause) { error.textContent = cause.message; }
  finally { button.disabled = false; }
});
