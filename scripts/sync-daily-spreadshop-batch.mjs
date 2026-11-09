import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookupMarketplaceOffer } from './marketplace-offer.mjs';

const ucmRoot = fileURLToPath(new URL('../', import.meta.url));
const cat = JSON.parse(fs.readFileSync(path.join(ucmRoot, 'data/catalog.json'), 'utf8'));
const additions = JSON.parse(fs.readFileSync(path.join(ucmRoot, 'data/catalog-additions.json'), 'utf8'));
const d30 = JSON.parse(fs.readFileSync(process.argv[2] || 'C:/Users/aaaho/Documents/Codex/2026-11-07/spreadshop-batch/spreadshop_recent_30_all_sellables_v2.json', 'utf8'));

// Build productTypeId lookup from existing Spreadshop catalog
const byPt = {
  '5082': {
    productType: 'Unisex Oversized Heavyweight T-Shirt',
    price: '$26.99',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Black', 'White', 'Charcoal', 'Sand']
  }
};
for (const p of cat) {
  if (p.id && p.id.startsWith('spreadshop-')) {
    const m = p.id.match(/-(\d+)$/);
    if (m && !byPt[m[1]]) {
      byPt[m[1]] = {
        productType: p.productType,
        price: p.price,
        sizes: p.sizes || [],
        colors: p.colors || []
      };
    }
  }
}

const jobs = d30.flatMap(comp => (comp.sellables || []).map(item => ({comp, item})));
const checked = new Array(jobs.length);
const withheld = [];
let next = 0;
async function checkBatch() {
  while (next < jobs.length) {
    const i = next++;
    const {comp, item} = jobs[i];
    const typeId = String(item.productTypeId);
    const appearance = item.appearanceIds?.[0];
    try {
      if (!item.vpString || appearance == null) throw new Error('Missing variant image or appearance');
      const offer = await lookupMarketplaceOffer(comp, item, typeId, appearance, byPt[typeId]?.productType || '');
      const image = 'https://image.spreadshirtmedia.com/image-server/v1/products/'+item.vpString+'/views/'+(item.defaultViewId || 1)+'/'+encodeURIComponent(offer.design)+'.png?width=600&height=600&appearanceId='+appearance;
      checked[i] = {id:'spreadshop-'+item.sellableId, image, name:offer.name, design:offer.design,
        productType:offer.productType || byPt[typeId]?.productType, price:'$'+offer.price.toFixed(2),
        url:offer.url, buyUrl:offer.url, store:'spreadshop', storeLabel:'Spreadshirt', brand:'Spreadshirt',
        verifiedAt:offer.verifiedAt, directOnly:true, description:comp.descriptionText || ''};
    } catch (error) {
      withheld.push({designId:comp.id, sellable:item.sellableId || null, reason:error.message});
    }
  }
}
await Promise.all(Array.from({length:4}, () => checkBatch()));
fs.mkdirSync(path.join(ucmRoot, 'checkout'), {recursive:true});
fs.writeFileSync(path.join(ucmRoot, 'checkout/batch-review.json'), JSON.stringify(withheld, null, 2)+'\n');
const newRecords = checked.filter(Boolean);
if (!newRecords.length) throw new Error('No exact merchant offers verified. Existing catalog retained.');
const featuredHoodies = newRecords.filter(row => row.id.endsWith('-20'));

// Deduplicate additions by id (keep existing Fourthwall + Nov 2 Gothic, prepend newRecords)
const existingMap = new Map();
for (const r of newRecords) existingMap.set(r.id, r);
for (const r of additions) {
  if (!existingMap.has(r.id) && r.name && !r.name.startsWith('undefined')) existingMap.set(r.id, r);
}
const mergedAdditions = [...existingMap.values()];

fs.writeFileSync(path.join(ucmRoot, 'data/catalog-additions.json'), JSON.stringify(mergedAdditions, null, 2) + '\n');

// Also update data/gothic-launch-verified.json with the 30 new featured hoodies + existing 10 Nov 2 hoodies
const prevGothic = JSON.parse(fs.readFileSync(path.join(ucmRoot, 'data/gothic-launch-verified.json'), 'utf8'));
const gothicMap = new Map();
for (const r of featuredHoodies) gothicMap.set(r.id, r);
for (const r of prevGothic) {
  if (!gothicMap.has(r.id) && r.name && !r.name.startsWith('undefined')) gothicMap.set(r.id, r);
}
const allGothicFeatured = [...gothicMap.values()].filter(row => row.url?.startsWith('https://www.spreadshirt.com/shop/design/'));
fs.writeFileSync(path.join(ucmRoot, 'data/gothic-launch-verified.json'), JSON.stringify(allGothicFeatured, null, 2) + '\n');

// Update spreadshop.html with all 40 featured Gothic hoodies (Today's 10 Nov 7 designs at the very top!)
const spreadshopHtmlPath = path.join(ucmRoot, 'spreadshop.html');
let spHtml = fs.readFileSync(spreadshopHtmlPath, 'utf8');
const articlesHtml = allGothicFeatured.map(p => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return `<article><a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="600" height="600"></a><h3>${esc(p.name)}</h3><p>${esc(p.price)} USD · Spreadshirt</p><a class="launch-buy" href="${esc(p.url)}" target="_blank" rel="noopener">Buy now on Spreadshirt →</a></article>`;
}).join('');

spHtml = spHtml.replace(
  /<section class="launch-collection">[\s\S]*?<\/section>/,
  () => `<section class="launch-collection"><h2>Gothic hoodies</h2><div class="launch-grid">${articlesHtml}</div></section>`
);
fs.writeFileSync(spreadshopHtmlPath, spHtml);
if (fs.existsSync(path.join(ucmRoot, 'dist'))) {
  fs.writeFileSync(path.join(ucmRoot, 'dist/spreadshop.html'), spHtml);
}

const totalCatalogCount = cat.length + mergedAdditions.length;
console.log(`Generated ${newRecords.length} new Spreadshop records across 30 designs.`);
console.log(`Merged catalog-additions.json count: ${mergedAdditions.length}`);
console.log(`New total Urban Clothes Market catalog count: ${totalCatalogCount}`);
