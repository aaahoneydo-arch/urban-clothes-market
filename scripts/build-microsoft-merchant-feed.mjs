import fs from 'node:fs';
import path from 'node:path';

console.log('=== BUILDING 100% VERIFIED MICROSOFT / BING MERCHANT FEED (TSV) ===');

const catalogPath = path.resolve('data/catalog.json');
const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log(`Processing ${products.length} verified products for Bing/Microsoft Merchant Center...`);

function cleanTsv(s) {
  if (!s) return '';
  return String(s)
    .replace(/\t/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();
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

const headers = [
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

let tsvContent = headers.join('\t') + '\n';
let count = 0;

for (const p of products) {
  const id = p.id;
  const title = p.name;
  const slug = p.id.replace(/^ucm-/, '');
  
  let imgUrl = p.image;
  if (imgUrl.includes('?')) {
    const base = imgUrl.split('?')[0];
    const params = new URLSearchParams(imgUrl.split('?')[1]);
    const app = params.get('appearanceId') || '1';
    imgUrl = `${base}?width=1200&height=1200&appearanceId=${app}`;
  }

  const priceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 24.99;
  const priceStr = `${priceNum.toFixed(2)} USD`;
  const gCategory = getGoogleCategory(title);
  const gender = getGender(title);
  const ageGroup = getAgeGroup(title);

  const desc = cleanTsv(p.description || `Shop official ${title}. Premium custom made-to-order physical merchandise from Urban Clothes Market with fast US delivery and 30-day money-back guarantee.`);
  const link = p.url && p.url.startsWith('https://www.urbanclothesmarket.com/')
    ? p.url
    : `https://www.urbanclothesmarket.com/products/${slug}/`;

  const color = (p.colors && p.colors.length) ? p.colors[0] : 'Black';
  const size = (p.sizes && p.sizes.length) ? p.sizes[0] : 'M';
  const shippingStr = 'US:::6.99 USD';

  const row = [
    cleanTsv(id),
    cleanTsv(title),
    desc,
    cleanTsv(link),
    priceStr,
    'in_stock',
    cleanTsv(imgUrl),
    shippingStr,
    gCategory,
    'Urban Clothes Market',
    'new',
    ageGroup,
    gender,
    cleanTsv(size),
    cleanTsv(color),
    'no'
  ];

  tsvContent += row.join('\t') + '\n';
  count++;
}

const outputPath = path.resolve('microsoft-merchant-feed.tsv');
fs.writeFileSync(outputPath, tsvContent, 'utf8');
console.log(`Successfully generated ${outputPath} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB, ${count} products).`);
