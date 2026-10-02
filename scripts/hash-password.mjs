import { pbkdf2Sync, randomBytes } from 'node:crypto';
const password = process.argv[2];
if (!password) { console.error('Aufruf: node scripts/hash-password.mjs "DEIN-PASSWORT"'); process.exit(1); }
const rounds = 210000; const salt = randomBytes(16); const hash = pbkdf2Sync(password, salt, rounds, 32, 'sha256');
console.log(`pbkdf2$${rounds}$${salt.toString('base64url')}$${hash.toString('base64url')}`);
