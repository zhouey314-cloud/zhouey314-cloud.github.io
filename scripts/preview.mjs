// Use the same loopback HTTP/Range implementation exercised by media tests.
import {serve} from '../tests/support.mjs';
if (process.env.BASE_URL) {
  throw Error('Unset BASE_URL for local preview; it selects a remote site in tests.');
}
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
