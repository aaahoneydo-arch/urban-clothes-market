import fs from 'node:fs';
import path from 'node:path';

const ucmRoot = 'C:/Users/aaaho/Documents/Codex/2026-10-08/what/work/urban-clothes-market';
const cat = JSON.parse(fs.readFileSync(path.join(ucmRoot, 'data/catalog.json'), 'utf8'));
const additions = JSON.parse(fs.readFileSync(path.join(ucmRoot, 'data/catalog-additions.json'), 'utf8'));
const d30 = JSON.parse(fs.readFileSync('C:/Users/aaaho/Documents/Codex/2026-11-07/spreadshop-batch/spreadshop_recent_30_all_sellables_v2.json', 'utf8'));

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

function toSlugPluses(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '+')
    .replace(/^\+|\+$/g, '');
}

const newRecords = [];
const featuredHoodies = [];

for (const comp of d30) {
  const title = comp.title;
  const slugPluses = toSlugPluses(title);
  for (const s of (comp.sellables || [])) {
    const ptId = String(s.productTypeId);
    const meta = byPt[ptId] || {
      productType: 'Unisex Graphic Apparel',
      price: '$24.99',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black', 'White']
    };
    const firstApp = (s.appearanceIds && s.appearanceIds.length) ? s.appearanceIds[0] : 1;
    const sellableId = s.sellableId || `${comp.uid36}-${ptId}`;
    const id = `spreadshop-${sellableId}`;
    const url = `https://urbanclothesmarket.myspreadshop.com/${slugPluses}-A${comp.id}?sellable=${sellableId}&appearance=${firstApp}`;
    const image = `https://image.spreadshirtmedia.com/image-server/v1/products/${s.vpString}/views/${s.defaultViewId || 1}/${encodeURIComponent(title)}.png?width=600&height=600&appearanceId=${firstApp}`;
    const rec = {
      image,
      name: `${title} - ${meta.productType}`,
      url,
      price: meta.price,
      store: 'spreadshop',
      storeLabel: 'Spreadshop',
      productType: meta.productType,
      id,
      design: title,
      brand: 'Spreadshop',
      directOnly: true,
      sizes: meta.sizes || [],
      colors: meta.colors || [],
      description: comp.description || 'Choose available sizes, colors and delivery options on the linked Spreadshop product page.'
    };
    newRecords.push(rec);
    if (ptId === '20') {
      featuredHoodies.push(rec);
    }
  }
}

// Deduplicate additions by id (keep existing Fourthwall + Nov 2 Gothic, prepend newRecords)
const existingMap = new Map();
for (const r of newRecords) existingMap.set(r.id, r);
for (const r of additions) {
  if (!existingMap.has(r.id)) existingMap.set(r.id, r);
}
const mergedAdditions = [...existingMap.values()];

fs.writeFileSync(path.join(ucmRoot, 'data/catalog-additions.json'), JSON.stringify(mergedAdditions, null, 2) + '\n');

// Also update data/gothic-launch-verified.json with the 30 new featured hoodies + existing 10 Nov 2 hoodies
const prevGothic = JSON.parse(fs.readFileSync(path.join(ucmRoot, 'data/gothic-launch-verified.json'), 'utf8'));
const gothicMap = new Map();
for (const r of featuredHoodies) gothicMap.set(r.id, r);
for (const r of prevGothic) {
  if (!gothicMap.has(r.id)) gothicMap.set(r.id, r);
}
const allGothicFeatured = [...gothicMap.values()];
fs.writeFileSync(path.join(ucmRoot, 'data/gothic-launch-verified.json'), JSON.stringify(allGothicFeatured, null, 2) + '\n');

// Update spreadshop.html with all 40 featured Gothic hoodies (Today's 10 Nov 7 designs at the very top!)
const spreadshopHtmlPath = path.join(ucmRoot, 'spreadshop.html');
let spHtml = fs.readFileSync(spreadshopHtmlPath, 'utf8');
const articlesHtml = allGothicFeatured.map(p => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return `<article><a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="600" height="600"></a><h3>${esc(p.name)}</h3><p>${esc(p.price)} USD · Direct Spreadshop Checkout</p><a class="launch-buy" href="${esc(p.url)}" target="_blank" rel="noopener">Buy Now on Spreadshop →</a></article>`;
}).join('');

spHtml = spHtml.replace(
  /<section class="launch-collection">[\s\S]*?<\/section>/,
  `<section class="launch-collection"><h2>New Daily Gothic Streetwear Drops (Live on Spreadshop)</h2><p>Featuring today's 10 brand-new Gothic designs (${newRecords.length.toLocaleString()}+ total new product variations published in Spreadshop). Every Buy Now button below links directly to its Spreadshop checkout page.</p><div class="launch-grid">${articlesHtml}</div><p style="margin-top:20px"><a class="launch-buy" href="https://urbanclothesmarket.myspreadshop.com/all" target="_blank" rel="noopener">Browse all Spreadshop products and styles →</a></p></section>`
);
fs.writeFileSync(spreadshopHtmlPath, spHtml);
if (fs.existsSync(path.join(ucmRoot, 'dist'))) {
  fs.writeFileSync(path.join(ucmRoot, 'dist/spreadshop.html'), spHtml);
}

const totalCatalogCount = cat.length + mergedAdditions.length;
console.log(`Generated ${newRecords.length} new Spreadshop records across 30 designs.`);
console.log(`Merged catalog-additions.json count: ${mergedAdditions.length}`);
console.log(`New total Urban Clothes Market catalog count: ${totalCatalogCount}`);
