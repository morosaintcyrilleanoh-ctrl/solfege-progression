// Extrait la police musicale Bravura (SIL Open Font License) fournie par VexFlow
// en fichier WOFF2 servi depuis /public : plus léger que la version encodée en
// base64 dans le JavaScript, et mis en cache par le navigateur.
// Usage : node scripts/extract-music-font.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
// require.resolve('vexflow') -> <pkg>/build/cjs/vexflow.js
const pkgDir = join(dirname(require.resolve('vexflow')), '..', '..');
const source = readFileSync(join(pkgDir, 'build/esm/src/fonts/bravura.js'), 'utf8');
const match = /base64,([A-Za-z0-9+/=]+)'/.exec(source);
if (!match) throw new Error('Police Bravura introuvable dans VexFlow');
mkdirSync('public/fonts', { recursive: true });
writeFileSync('public/fonts/bravura.woff2', Buffer.from(match[1], 'base64'));
console.log('public/fonts/bravura.woff2 écrit');
