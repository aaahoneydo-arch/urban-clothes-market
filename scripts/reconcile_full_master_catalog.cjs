const fs = require('fs');
const path = require('path');

console.log('=== RECONCILING FULL MULTI-CHANNEL MASTER CATALOG ===');

// 1. Load current catalog
const currentCatalog = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
console.log(`Current catalog items: ${currentCatalog.length}`);

// 2. Extract non-Spreadshop verified items
const nonSpreadshop = currentCatalog.filter(p => {
  const ch = (p.channel || '').toLowerCase();
  const url = (p.url || '').toLowerCase();
  return ch === 'printify' || ch === 'zazzle' || ch === 'teepublic' || ch === 'redbubble' ||
         url.includes('printify') || url.includes('zazzle') || url.includes('teepublic') || url.includes('redbubble');
});
console.log(`Verified non-Spreadshop items: ${nonSpreadshop.length}`);

// 3. Load freshly extracted 9,504 Spreadshop products
const liveSpreadshop = JSON.parse(fs.readFileSync('scratch/spreadshop_full_live_catalog.json', 'utf8'));
console.log(`Live extracted Spreadshop items: ${liveSpreadshop.length}`);

// Ensure every existing Spreadshop item in catalog with detailed sizes/colors/names gets preserved or enriched
const existingSpreadMap = new Map();
currentCatalog.forEach(p => {
  if (p.url && p.url.includes('spreadshop')) {
    const u = new URL(p.url);
    const sellable = u.searchParams.get('sellable');
    if (sellable) existingSpreadMap.set(sellable, p);
  }
});

const mergedSpreadshop = [];
const seenSpreadSellables = new Set();

// First add all live extracted Spreadshop products
for (const item of liveSpreadshop) {
  const u = new URL(item.url);
  const sellable = u.searchParams.get('sellable');
  if (!sellable || seenSpreadSellables.has(sellable)) continue;
  seenSpreadSellables.add(sellable);

  // If we had enriched sizes/colors in previous catalog, merge them
  const prev = existingSpreadMap.get(sellable);
  mergedSpreadshop.push({
    id: `spreadshop-${sellable}`,
    name: item.name || prev?.name || 'Urban Clothes Market Apparel',
    url: item.url,
    image: item.image || prev?.image || '',
    price: item.price || prev?.price || '$30.99',
    sizes: (prev && prev.sizes && prev.sizes.length) ? prev.sizes : item.sizes,
    colors: (prev && prev.colors && prev.colors.length) ? prev.colors : item.colors,
    brand: 'Spreadshop',
    channel: 'Spreadshop'
  });
}

// Check if any previous Spreadshop items weren't in the 99 pages
for (const [sellable, prev] of existingSpreadMap.entries()) {
  if (!seenSpreadSellables.has(sellable)) {
    seenSpreadSellables.add(sellable);
    mergedSpreadshop.push({
      id: `spreadshop-${sellable}`,
      name: prev.name,
      url: prev.url,
      image: prev.image,
      price: prev.price || '$30.99',
      sizes: prev.sizes || ['S', 'M', 'L', 'XL'],
      colors: prev.colors || ['Black', 'White'],
      brand: 'Spreadshop',
      channel: 'Spreadshop'
    });
  }
}

console.log(`Total reconciled Spreadshop items: ${mergedSpreadshop.length}`);

// 4. Combine all channels
const finalCatalog = [...mergedSpreadshop, ...nonSpreadshop];
console.log(`\n=== FINAL CONSOLIDATED CATALOG SUMMARY ===`);
console.log(`Total products: ${finalCatalog.length}`);

const channelBreakdown = {};
finalCatalog.forEach(p => {
  channelBreakdown[p.channel] = (channelBreakdown[p.channel] || 0) + 1;
});
console.log('Channel Breakdown:', channelBreakdown);

// Verify direct links on all products
let missingDirectUrl = 0;
finalCatalog.forEach(p => {
  if (!p.url || p.url.startsWith('/') || !p.url.startsWith('http')) {
    missingDirectUrl++;
  }
});
console.log(`Items missing valid direct URLs: ${missingDirectUrl}`);

// Write back to data/catalog.json
fs.writeFileSync('data/catalog.json', JSON.stringify(finalCatalog, null, 2) + '\n');
console.log('Successfully wrote to data/catalog.json');
