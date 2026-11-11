// The approved SVG was independently decoded with Apple Vision and Core Image.
// CI verifies the saveable PNG has exactly that matrix, including its quiet zone.
// It does not claim that WeChat accepts the account on a physical phone.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';

const read = path => readFileSync(new URL('../' + path, import.meta.url));
const approved = 'https://u.wechat.com/MJNJhDRZFiAFKD09uKIRGvM?s=3';
const svgHash = 'ed25fbd4b457f5ac921e052508712b23e43bc03e700140d54dce62e300e517e0';

test('saveable WeChat PNG preserves every pixel of the approved QR modules', () => {
  const svg = read('public/contact/wechat-qr.svg');
  assert.equal(createHash('sha256').update(svg).digest('hex'), svgHash);
  const contacts = JSON.parse(read('content/portfolio.json')).contactLinks;
  assert.equal(contacts.find(c => c.id === 'wechat').href, approved);
  const matrix = Array.from({length:49}, () => Array(49).fill(false));
  const path = svg.toString().match(/<path[^>]* d="([^"]+)"/)[1];
  const modules = [...path.matchAll(/M(\d+) (\d+)h(\d+)v1H(\d+)z/g)];
  assert.equal(modules.map(m => m[0]).join(' '), path, 'all SVG instructions are understood');
  for (const [, x, y, length, closing] of modules) {
    assert.equal(+closing, +x);
    assert(+x >= 4 && +y >= 4 && +x + +length <= 45 && +y < 45, '4-module quiet zone');
    for (let i=0; i<+length; i++) matrix[+y][+x+i] = true;
  }
  const png = read('public/contact/wechat-qr.png');
  assert.equal(png.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
  const chunks = [];
  for (let offset=8; offset<png.length;) {
    const length=png.readUInt32BE(offset), type=png.toString('ascii',offset+4,offset+8);
    assert(offset+12+length <= png.length, 'complete PNG chunk');
    chunks.push({type, data:png.subarray(offset+8,offset+8+length)});
    offset += 12+length;
  }
  const header=chunks.find(c=>c.type==='IHDR').data;
  assert.equal(header.readUInt32BE(0),784); assert.equal(header.readUInt32BE(4),784);
  assert.deepEqual([...header.subarray(8)], [8,2,0,0,0], 'RGB8, noninterlaced');
  const pixels=inflateSync(Buffer.concat(chunks.filter(c=>c.type==='IDAT').map(c=>c.data)));
  const stride=784*3+1;
  assert.equal(pixels.length,stride*784);
  for (let y=0; y<784; y++) {
    assert.equal(pixels[y*stride],0,'lossless unfiltered rows');
    for (let x=0; x<784; x++) {
      const offset=y*stride+1+x*3;
      const expected=matrix[Math.floor(y/16)][Math.floor(x/16)] ? [0x22,0x45,0x2d] : [255,255,255];
      for (let c=0;c<3;c++) assert.equal(pixels[offset+c],expected[c],`pixel ${x},${y},channel ${c}`);
    }
  }
});

test('both static contact sections offer the PNG with same-phone instructions and original SVG', () => {
  for (const name of ['index.html','collaborate.html']) {
    const html=read(name).toString();
    assert(html.includes(`href="/public/contact/wechat-qr.png" data-wechat-profile="${approved}" target="_blank" rel="noopener noreferrer"`));
    assert(html.includes('aria-describedby="wechat-instructions"'));
    assert(html.includes('扫一扫 → 相册'));
    assert(html.includes('download="enyu-wechat-qr.png"'));
    assert(html.includes('href="/public/contact/wechat-qr.svg"'));
  }
});
