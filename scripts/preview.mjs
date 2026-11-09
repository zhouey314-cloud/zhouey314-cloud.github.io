// Use the same loopback HTTP/Range implementation exercised by media tests.
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
if (process.env.BASE_URL) {
  throw Error('Unset BASE_URL for local preview; it selects a remote site in tests.');
}
process.env.SITE_DIR=resolve(process.argv[2] || 'dist');
if(!existsSync(resolve(process.env.SITE_DIR,'index.html')))throw Error('Run npm run build before starting the static preview.');
const {serve}=await import('../tests/support.mjs');
const site = await serve();
console.log(`Portfolio preview: ${site.base}`);
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await site.close();
}
process.once('SIGINT', close);
process.once('SIGTERM', close);
