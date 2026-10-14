import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { normalize, THEMES } from '../src/catalog-core.mjs';

const distDir = 'dist-test';
console.log('Testing hub in', distDir, '...');

const existing = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const all = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_all_products_catalog.json', 'utf8'));
const audit = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_live_audit_raw.json', 'utf8'));
const log = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_published_log.json', 'utf8'));

const pubAuditIds = new Set(audit.items.filter(i => i.published).map(i => String(i.threadless_id)));
const allPubIds = new Set([...pubAuditIds, ...log.published.map(p => String(p.threadless_id))]);

const existingIds = new Set();
for (const p of existing) {
  const url = new URL(p.url);
  const id = p.store === 'Spreadshop' ? url.searchParams.get('sellable') : p.id;
  existingIds.add(id);
}

const tees = all.filter(p => 
  p.id && 
  p.id.endsWith('-m-ts-cla') && 
  p.image_link && 
  !p.image_link.includes('mockup-preview') && 
  allPubIds.has(String(p.design_id))
);

const additions = [];
for (const t of tees) {
  const newId = 'threadless-' + t.design_id;
  if (existingIds.has(newId)) continue;
  existingIds.add(newId);

  const designName = t.title.replace(/\s*-\s*Men['’]s Classic T-Shirt$/i, '').trim();
  additions.push({
    id: newId,
    design: designName,
    productType: "Classic T-Shirt",
    name: `${designName} - Classic T-Shirt`,
    url: t.link,
    image: t.image_link,
    sourceImage: t.image_link,
    store: "Threadless",
    sourceDate: "2026-10-14"
  });
}

const combined = [...existing, ...additions];
const products = normalize(combined);

assert(products.length > 6680);
assert.equal(new Set(products.map(p => p.id)).size, products.length);
assert.equal(new Set(products.map(p => p.path)).size, products.length);
assert.equal(THEMES.find(t => t[0] === 'cars')[2].test('Care for the garden'), false);

console.log('Checking all', products.length, 'product pages in', distDir, '...');
for (const p of products) {
  assert(!/urbanclothesmarket\.com/.test(new URL(p.url).hostname));
  assert(!/flow-gen/i.test(p.name));
  assert(p.design && p.productType);
  if (p.image.startsWith('/')) assert(fs.existsSync(path.join(distDir, p.image)));
  const html = fs.readFileSync(path.join(distDir, p.path, 'index.html'), 'utf8');
  assert(html.includes('BUY NOW!'));
  assert(html.includes(p.url.replaceAll('&', '&amp;')));
  if (p.price === null) assert(!html.includes('detail-price">$0.00'));
}

console.log('Checking forbidden commerce code & broken links...');
const files = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else files.push(full);
  }
}
walk(distDir);

const forbidden = /completeCheckout|google_customer_reviews|gapi\.surveyoptin|Google Customer Reviews partner|merchant-feed|add-to-cart|type=["'](?:email|password)["']/i;
let htmlCount = 0;
const refs = new Set();
for (const file of files) {
  if (!/\.(?:html|js)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  assert(!forbidden.test(text), 'Obsolete commerce code in ' + file);
  if (!file.endsWith('.html')) continue;
  htmlCount++;
  for (const match of text.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) refs.add(match[1]);
}

for (const ref of refs) {
  const dest = path.join(distDir, decodeURIComponent(ref));
  assert(fs.existsSync(dest) && (!ref.endsWith('/') || fs.existsSync(path.join(dest, 'index.html'))), 'Broken internal reference ' + ref);
}

assert(!files.some(f => /merchant.*feed|order-confirmation\.js/i.test(f)));

console.log(JSON.stringify({
  status: 'PASS',
  products: products.length,
  htmlPages: htmlCount,
  internalReferences: refs.size,
  stores: [...new Set(products.map(p => p.store))],
  checks: [
    'unique source identities',
    'product-specific external destinations',
    'local image files',
    'all internal links',
    'no cart/payment/merchant widgets',
    'unknown prices not fabricated'
  ]
}, null, 2));
