import fs from 'node:fs';
import assert from 'node:assert/strict';

const input = process.argv[2];
assert(input, 'Provide the captured public catalog pages JSON path.');
const pages = JSON.parse(fs.readFileSync(input, 'utf8'));
assert(Array.isArray(pages) && pages.length, 'Catalog capture is empty.');
const shop = 'urbanclothesmarket.myspreadshop.com';
const pageNumber = url => Number(new URL(url).searchParams.get('page') || 1);
const paginationLinks = page => page.pageLinks.filter(link => {
  const url = new URL(link.href);
  return url.hostname === shop && url.pathname === '/all' && [...url.searchParams.keys()].every(key => key === 'page');
});
const declaredLastPage = Math.max(...pages.flatMap(page => paginationLinks(page).map(link => pageNumber(link.href))));
assert.equal(pages.length, declaredLastPage, 'Capture must include every public catalog page.');
const products = [];
const seen = new Set();
for (const [index, page] of pages.entries()) {
  assert.equal(new URL(page.url).hostname, shop);
  assert.equal(pageNumber(page.url), index + 1, 'Catalog pages must be consecutive.');
  assert(page.rows.length > 0 && page.rows.length <= 96);
  if (index < pages.length - 1) assert.equal(page.rows.length, 96, 'An intermediate page was incomplete.');
  for (const row of page.rows) {
    const url = new URL(row.url);
    const image = new URL(row.image);
    const id = url.searchParams.get('sellable');
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, shop);
    assert(id && url.pathname.includes('-A') && url.searchParams.has('appearance'));
    assert.equal(image.protocol, 'https:');
    assert.equal(image.hostname, 'image.spreadshirtmedia.com');
    assert(row.name && !row.name.includes('\uFFFD'));
    assert(/^\$\d+\.\d{2}$/.test(row.price), 'Invalid catalog price: ' + row.name);
    assert(Array.isArray(row.sizes) && Array.isArray(row.colors));
    assert(!seen.has(id), 'Duplicate listing: ' + id);
    seen.add(id);
    products.push({colors: row.colors, image: row.image, name: row.name, price: row.price, sizes: row.sizes, url: row.url});
  }
}
const previous = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const oldProducts = new Map(previous.map(row => [new URL(row.url).searchParams.get('sellable'), row]));
const oldIds = new Set(previous.map(row => new URL(row.url).searchParams.get('sellable')));
const design = row => row.name.split(' - ').slice(0, -1).join(' - ');
const added = products.filter(row => !oldIds.has(new URL(row.url).searchParams.get('sellable')));
const removed = previous.filter(row => !seen.has(new URL(row.url).searchParams.get('sellable')));
const changed = products.filter(row => {
  const old = oldProducts.get(new URL(row.url).searchParams.get('sellable'));
  return old && ['name', 'price', 'url', 'image', 'sizes', 'colors'].some(key => JSON.stringify(old[key]) !== JSON.stringify(row[key]));
});
const checkedAt = new Date().toISOString();
const report = {
  source: 'https://' + shop + '/all', checkedAt, checkedDate: new Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric'}).format(new Date(checkedAt)),
  publicPages: pages.length, previousListings: previous.length, listings: products.length,
  addedListings: added.length, removedListings: removed.length, changedListings: changed.length,
  addedDesigns: [...new Set(added.map(design))].map(name => ({name, listings: added.filter(row => design(row) === name).length})),
  removedDesigns: [...new Set(removed.map(design))]
};
fs.writeFileSync('data/catalog.json', JSON.stringify(products, null, 2) + '\n');
fs.writeFileSync('data/catalog-sync.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
