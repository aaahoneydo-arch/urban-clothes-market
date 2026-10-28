import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { normalize } from '../src/catalog-model.mjs';
import { ORIGIN } from '../src/templates.mjs';

console.log('=== BUILDING ALL VERIFIED MERCHANT FEEDS (BING TSV, FACEBOOK CSV, PINTEREST CSV, GOOGLE XML) ===');

const raw = JSON.parse(fs.readFileSync(path.resolve('data/catalog.json'), 'utf8'));
const products = normalize(raw);

console.log(`Loaded ${products.length} normalized verified 5-store products from data/catalog.json...`);

function cleanTsv(s) {
  if (!s) return '';
  return String(s).replace(/\t/g, ' ').replace(/\r?\n/g, ' ').trim();
}

function csvCell(s) {
  const str = String(s ?? '').replace(/\r?\n/g, ' ').trim();
  return `"${str.replace(/"/g, '""')}"`;
}

function escXml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getGoogleCategory(name) {
  const n = (name || '').toLowerCase();
  if (/mug|drinkware|bottle|tumbler/.test(n)) return '212';
  if (/poster|art print|canvas|wall art/.test(n)) return '500044';
  if (/sticker|decal|magnet|pin|badge/.test(n)) return '505389';
  if (/bag|tote|backpack/.test(n)) return '100';
  if (/hat|cap|beanie/.test(n)) return '173';
  if (/pillow|blanket|cushion/.test(n)) return '536';
  return '1604';
}

function getGoogleCategoryPath(name) {
  const n = (name || '').toLowerCase();
  if (/mug|drinkware|bottle|tumbler/.test(n)) return 'Home & Garden > Kitchen & Dining > Tableware > Drinkware';
  if (/poster|art print|canvas|wall art/.test(n)) return 'Home & Garden > Decor > Artwork';
  if (/sticker|decal|magnet|pin|badge/.test(n)) return 'Apparel & Accessories > Handbag & Wallet Accessories';
  if (/bag|tote|backpack/.test(n)) return 'Apparel & Accessories > Handbags, Wallets & Cases';
  if (/hat|cap|beanie/.test(n)) return 'Apparel & Accessories > Clothing Accessories > Hats';
  if (/pillow|blanket|cushion/.test(n)) return 'Home & Garden > Linens & Bedding';
  return 'Apparel & Accessories > Clothing';
}

function getGender(name) {
  const n = (name || '').toLowerCase();
  if (/\bwomen'?s\b|\bladies\b/.test(n)) return 'female';
  if (/\bmen'?s\b|\bmens\b/.test(n)) return 'male';
  return 'unisex';
}

function getAgeGroup(name) {
  const n = (name || '').toLowerCase();
  if (/kid|baby|toddler|youth|infant/.test(n)) return 'kids';
  return 'adult';
}

function resolveFeedImage(img) {
  if (!img) return `${ORIGIN}/favicon.svg`;
  if (img.startsWith('/')) return `${ORIGIN}${img}`;
  if (img.includes('spreadshirtmedia.com') && img.includes('?')) {
    const base = img.split('?')[0];
    const params = new URLSearchParams(img.split('?')[1]);
    const app = params.get('appearanceId') || '1';
    return `${base}?width=1200&height=1200&appearanceId=${app}`;
  }
  return img;
}

const tsvHeaders = [
  'id',
  'title',
  'description',
  'link',
  'price',
  'availability',
  'image_link',
  'shipping',
  'google_product_category',
  'brand',
  'condition',
  'age_group',
  'gender',
  'size',
  'color',
  'identifier_exists'
];

const fbHeaders = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'google_product_category',
  'fb_product_category'
];

const pinHeaders = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'price',
  'availability',
  'condition',
  'brand',
  'google_product_category'
];

const tsvLines = [tsvHeaders.join('\t')];
const fbLines = [fbHeaders.join(',')];
const pinLines = [pinHeaders.join(',')];
const xmlItems = [];

for (const p of products) {
  const id = p.id;
  const title = p.name;
  const canonicalLink = `${ORIGIN}${p.path}`;
  const imgUrl = resolveFeedImage(p.image);
  const priceStr = `${p.price.toFixed(2)} USD`;
  const gCatId = getGoogleCategory(title);
  const gCatPath = getGoogleCategoryPath(title);
  const gender = getGender(title);
  const ageGroup = getAgeGroup(title);
  const color = (p.colors && p.colors.length) ? p.colors[0] : 'Black';
  const size = (p.sizes && p.sizes.length) ? p.sizes[0] : 'M';
  const desc = cleanTsv(
    p.description ||
    `Shop official ${title} at Urban Clothes Market. Custom made-to-order graphic merchandise fulfilled via verified partner store (${p.storeLabel || p.store}). Direct checkout link: ${canonicalLink}`
  );

  // 1. Bing / Microsoft Merchant TSV row
  tsvLines.push([
    cleanTsv(id),
    cleanTsv(title),
    desc,
    cleanTsv(canonicalLink),
    priceStr,
    'in_stock',
    cleanTsv(imgUrl),
    'US:::6.99 USD',
    gCatId,
    cleanTsv(p.brand || 'Urban Clothes Market'),
    'new',
    ageGroup,
    gender,
    cleanTsv(size),
    cleanTsv(color),
    'no'
  ].join('\t'));

  // 2. Facebook Catalog CSV row
  fbLines.push([
    csvCell(id),
    csvCell(title),
    csvCell(desc),
    csvCell('in stock'),
    csvCell('new'),
    csvCell(priceStr),
    csvCell(canonicalLink),
    csvCell(imgUrl),
    csvCell(p.brand || 'Urban Clothes Market'),
    csvCell(gCatPath),
    csvCell('Clothing & Accessories > Clothing')
  ].join(','));

  // 3. Pinterest Catalog CSV row
  pinLines.push([
    csvCell(id),
    csvCell(title),
    csvCell(desc),
    csvCell(canonicalLink),
    csvCell(imgUrl),
    csvCell(priceStr),
    csvCell('in_stock'),
    csvCell('new'),
    csvCell(p.brand || 'Urban Clothes Market'),
    csvCell(gCatPath)
  ].join(','));

  // 4. Google Merchant XML item
  xmlItems.push(`    <item>
      <g:id>${escXml(id)}</g:id>
      <g:title>${escXml(title)}</g:title>
      <g:description>${escXml(desc)}</g:description>
      <g:link>${escXml(canonicalLink)}</g:link>
      <g:image_link>${escXml(imgUrl)}</g:image_link>
      <g:price>${priceStr}</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escXml(p.brand || 'Urban Clothes Market')}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${gCatId}</g:google_product_category>
      <g:gender>${gender}</g:gender>
      <g:age_group>${ageGroup}</g:age_group>
      <g:color>${escXml(color)}</g:color>
      <g:size>${escXml(size)}</g:size>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>6.99 USD</g:price>
      </g:shipping>
    </item>`);
}

const tsvContent = tsvLines.join('\n') + '\n';
const fbContent = fbLines.join('\n') + '\n';
const pinContent = pinLines.join('\n') + '\n';
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Urban Clothes Market Master Product Catalog</title>
    <link>${ORIGIN}</link>
    <description>Authentic Streetwear, Graphic Apparel, Custom Home Decor, Drinkware &amp; Published Books</description>
${xmlItems.join('\n')}
  </channel>
</rss>\n`;

// Write TSV feeds
fs.writeFileSync('bing-merchant-spreadshop-all-products.tsv', tsvContent, 'utf8');
fs.writeFileSync('microsoft-merchant-feed.tsv', tsvContent, 'utf8');

// Write Facebook CSV feed (+ gz)
fs.writeFileSync('facebook-catalog-feed.csv', fbContent, 'utf8');
fs.writeFileSync('facebook-catalog-feed.csv.gz', zlib.gzipSync(Buffer.from(fbContent, 'utf8')));

// Write Pinterest CSV feeds
fs.writeFileSync('pinterest-catalog-feed.csv', pinContent, 'utf8');
fs.writeFileSync('pinterest-catalog.csv', pinContent, 'utf8');

// Write Google XML feeds (+ gz)
fs.writeFileSync('google-merchant-feed.xml', xmlContent, 'utf8');
fs.writeFileSync('google-merchant-feed.xml.gz', zlib.gzipSync(Buffer.from(xmlContent, 'utf8')));
fs.writeFileSync('google-merchant-spreadshop-all-products.xml', xmlContent, 'utf8');
fs.writeFileSync('google-merchant-spreadshop-all-products.xml.gz', zlib.gzipSync(Buffer.from(xmlContent, 'utf8')));

// Also copy feeds into dist/ so both root and dist/ have identical clean feeds
if (fs.existsSync('dist')) {
  for (const f of [
    'bing-merchant-spreadshop-all-products.tsv',
    'microsoft-merchant-feed.tsv',
    'facebook-catalog-feed.csv',
    'facebook-catalog-feed.csv.gz',
    'pinterest-catalog-feed.csv',
    'pinterest-catalog.csv',
    'google-merchant-feed.xml',
    'google-merchant-feed.xml.gz',
    'google-merchant-spreadshop-all-products.xml',
    'google-merchant-spreadshop-all-products.xml.gz'
  ]) {
    fs.copyFileSync(f, path.join('dist', f));
  }
}

console.log(`✓ Generated bing-merchant-spreadshop-all-products.tsv (${products.length} rows)`);
console.log(`✓ Generated facebook-catalog-feed.csv (${products.length} rows)`);
console.log(`✓ Generated pinterest-catalog-feed.csv & pinterest-catalog.csv (${products.length} rows)`);
console.log(`✓ Generated google-merchant-feed.xml & .gz (${products.length} items)`);
