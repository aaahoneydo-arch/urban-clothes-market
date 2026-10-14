import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {normalize,THEMES} from '../src/catalog-core.mjs';
const products=normalize(JSON.parse(fs.readFileSync('data/catalog.json','utf8')));
assert(products.length>6680);assert.equal(new Set(products.map(p=>p.id)).size,products.length);assert.equal(new Set(products.map(p=>p.path)).size,products.length);
assert.equal(THEMES.find(t=>t[0]==='cars')[2].test('Care for the garden'),false);
for(const p of products){assert(!/urbanclothesmarket\.com/.test(new URL(p.url).hostname));assert(!/flow-gen/i.test(p.name));assert(p.design&&p.productType);if(p.image.startsWith('/'))assert(fs.existsSync('dist'+p.image));const html=fs.readFileSync('dist'+p.path+'index.html','utf8');assert(html.includes('BUY NOW!'));assert(html.includes(p.url.replaceAll('&','&amp;')));if(p.price===null)assert(!html.includes('detail-price">$0.00'));}
assert.throws(()=>normalize([{name:'Invalid - Hoodie',image:'/missing.png',url:'https://urbanclothesmarket.com/products/invalid/'}]),/Unsupported/);
assert.throws(()=>normalize([JSON.parse(fs.readFileSync('data/catalog.json'))[0],JSON.parse(fs.readFileSync('data/catalog.json'))[0]]),/duplicate/);
const files=[];function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else files.push(full);}}walk('dist');
const forbidden=/completeCheckout|google_customer_reviews|gapi\.surveyoptin|Google Customer Reviews partner|merchant-feed|add-to-cart|type=["'](?:email|password)["']/i;
let htmlCount=0;const refs=new Set();
for(const file of files){if(!/\.(?:html|js)$/.test(file))continue;const text=fs.readFileSync(file,'utf8');assert(!forbidden.test(text),'Obsolete commerce code in '+file);if(!file.endsWith('.html'))continue;htmlCount++;for(const match of text.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g))refs.add(match[1]);}
for(const ref of refs){const dest=path.join('dist',decodeURIComponent(ref));assert(fs.existsSync(dest)&&(!ref.endsWith('/')||fs.existsSync(path.join(dest,'index.html'))),'Broken internal reference '+ref);}
assert(!files.some(f=>/merchant.*feed|order-confirmation\.js/i.test(f)));
console.log(JSON.stringify({status:'PASS',products:products.length,htmlPages:htmlCount,internalReferences:refs.size,stores:[...new Set(products.map(p=>p.store))],checks:['unique source identities','product-specific external destinations','local image files','all internal links','no cart/payment/merchant widgets','unknown prices not fabricated']}));
