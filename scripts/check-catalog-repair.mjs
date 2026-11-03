import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalize} from '../src/catalog-model.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const raw=[...read('data/catalog.json'),...read('data/catalog-additions.json')];
const products=normalize(raw);
assert.equal(products.length,18682);
assert.equal(new Set(products.map(p=>p.id)).size,products.length);
assert.equal(products.filter(p=>p.store==='fourthwall').length,50);
assert.equal(read('catalog/index.json').rows.length,products.length);
for(const p of products){assert.equal(p.buyUrl,p.url);assert.equal(new URL(p.url).protocol,'https:');}
assert(products.slice(-60).every(p=>p.path===p.url));
for(const [productType,category] of [['Long Sleeve T-Shirt','tees'],['Canvas Tote Bag','bags'],['Full Button Jersey','tees'],['Laptop Sleeve','tech'],['Pin Button','stickers'],['Canvas Art Print','art']]){
 assert.equal(normalize([{id:productType,name:'Category regression',productType,url:'https://example.com/item'}])[0].category,category);
}
console.log('PASS: 18,682 unique product records, exact HTTPS buy links, 60 verified additions, six category regressions.');
