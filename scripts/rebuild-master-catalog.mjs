import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

console.log('=== MASTER CATALOG & GOOGLE MERCHANT FEED REBUILDER ===');

// 1. Load verified base catalog (Spreadshirt physical mockups)
const baseCatalogPath = path.resolve('data/catalog.json');
let baseProducts = [];
try {
  baseProducts = JSON.parse(fs.readFileSync(baseCatalogPath, 'utf8'));
} catch (e) {
  console.error('Error reading base catalog:', e.message);
}

// Ensure base products only contain valid spreadshirt or live images
baseProducts = baseProducts.filter(p => {
  if (!p.image || p.image.includes('jasontvmarketplace.com')) return false;
  return true;
});
console.log(`Loaded ${baseProducts.length} verified Spreadshirt listings.`);

// 2. Load newly generated physical mockup listings
const generatedCatalogPath = path.resolve('data/generated-mockup-catalog.json');
let generatedProducts = [];
try {
  generatedProducts = JSON.parse(fs.readFileSync(generatedCatalogPath, 'utf8'));
} catch (e) {
  console.log('Generated mockup catalog not ready or empty yet:', e.message);
}
console.log(`Loaded ${generatedProducts.length} newly composited physical mockup listings.`);

// Combine catalogs - Priority physical mockups FIRST
const masterCatalog = [...generatedProducts];
const seenIds = new Set(generatedProducts.map(p => p.id));

for (const p of baseProducts) {
  const sellable = (p.url || '').split('sellable=')[1]?.split('&')[0] || p.id || p.name;
  if (!seenIds.has(sellable)) {
    seenIds.add(sellable);
    masterCatalog.push(p);
  }
}

console.log(`\nMASTER CATALOG TOTAL LISTINGS: ${masterCatalog.length}`);
fs.writeFileSync('data/catalog.json', JSON.stringify(masterCatalog, null, 2), 'utf8');

// 3. Build Google Merchant Feed
function escXml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getGoogleCategory(name, existingCat) {
  if (existingCat) return existingCat;
  const n = (name || '').toLowerCase();
  if (/mug|drinkware|bottle|tumbler/.test(n)) return '212';
  if (/poster|art print|canvas|wall art/.test(n)) return '500044';
  if (/sticker|decal|magnet|pin|badge/.test(n)) return '505389';
  if (/bag|tote|backpack/.test(n)) return '100';
  if (/hat|cap|beanie/.test(n)) return '173';
  if (/pillow|blanket|cushion|linens/.test(n)) return '536';
  if (/phone|case/.test(n)) return '202';
  return '1604';
}

function getGender(name) {
  const n = (name || '').toLowerCase();
  if (/\bwomen'?s\b|\bladies\b/.test(n)) return 'female';
  if (/\bmen'?s\b/.test(n)) return 'male';
  return 'unisex';
}

function getAgeGroup(name) {
  const n = (name || '').toLowerCase();
  if (/kid|baby|toddler|youth|infant/.test(n)) return 'kids';
  return 'adult';
}

let itemsXml = '';
let feedCount = 0;

for (const p of masterCatalog) {
  const id = escXml(p.id || `ucm-${feedCount}`);
  const title = escXml(p.name);
  const link = escXml(p.url);
  const image = escXml(p.image);
  const priceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 24.99;
  const priceStr = `${priceNum.toFixed(2)} USD`;
  const gCategory = getGoogleCategory(p.name, p.googleProductCategory);
  const gender = getGender(p.name);
  const ageGroup = getAgeGroup(p.name);

  const desc = escXml(`Official ${p.name} from Urban Clothes Market. Authentic made-to-order physical merchandise. Premium high-resolution print on durable materials. 100% satisfaction guarantee with 30-day returns and fast US delivery.`);

  itemsXml += `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${image}</g:image_link>
      <g:price>${priceStr}</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Urban Clothes Market</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${gCategory}</g:google_product_category>
      <g:gender>${gender}</g:gender>
      <g:age_group>${ageGroup}</g:age_group>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>6.99 USD</g:price>
      </g:shipping>
    </item>\n`;

  feedCount++;
}

const feedContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Urban Clothes Market Master Product Catalog</title>
    <link>https://www.urbanclothesmarket.com</link>
    <description>Authentic Streetwear, Graphic Apparel, Custom Home Decor &amp; Drinkware</description>
${itemsXml}  </channel>
</rss>`;

fs.writeFileSync('google-merchant-feed.xml', feedContent, 'utf8');
console.log(`Wrote google-merchant-feed.xml (${(feedContent.length / 1024 / 1024).toFixed(2)} MB, ${feedCount} products).`);

const gzipped = zlib.gzipSync(Buffer.from(feedContent, 'utf8'));
fs.writeFileSync('google-merchant-feed.xml.gz', gzipped);
console.log(`Wrote google-merchant-feed.xml.gz (${(gzipped.length / 1024 / 1024).toFixed(2)} MB).`);
console.log('=== REBUILD COMPLETE ===');
