import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

console.log('=== MULTIPLYING MASTER CATALOG TO MAXIMUM MERCHANT VARIANT SKUS ===');

const baseCatalog = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
console.log(`Starting with ${baseCatalog.length} base physical listings...`);

const COLORWAYS = {
  'tshirt-black': ['Jet Black', 'Vintage Charcoal', 'Dark Heather', 'Night Sky Navy'],
  'hoodie-black': ['Charcoal Black', 'Heather Graphite', 'Midnight Navy', 'Onyx'],
  'tshirt-white': ['Pure White', 'Ivory Cream', 'Natural Cotton', 'Off-White'],
  'mug-white': ['Glossy White', 'Accent Black Rim', 'Accent Navy Rim'],
  'tote-natural': ['Natural Organic Canvas', 'Vintage Sand Canvas'],
  'poster-framed': ['Gallery Black Frame', 'Solid Oak Wood Frame', 'Minimalist White Frame'],
  'pillow-linen': ['Natural Oatmeal Linen', 'Soft Heather Slate', 'Warm Sandstone'],
  'phonecase-white': ['Matte Slim Shell', 'Tough Double-Layer Armor', 'Gloss Impact Protection'],
  'sticker-diecut': ['Matte Heavyweight Vinyl', 'Gloss UV-Protected Laminate']
};

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
let totalSkuCount = 0;

for (const p of baseCatalog) {
  const priceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 24.99;
  const priceStr = `${priceNum.toFixed(2)} USD`;
  const gCategory = getGoogleCategory(p.name);
  const gender = getGender(p.name);
  const ageGroup = getAgeGroup(p.name);

  // Check if this is a newly generated mockup product with variants
  const prodKeyMatch = p.url?.match(/(tshirt-black|hoodie-black|tshirt-white|mug-white|tote-natural|poster-framed|pillow-linen|phonecase-white|sticker-diecut)/);
  const prodKey = prodKeyMatch ? prodKeyMatch[1] : null;

  if (prodKey && COLORWAYS[prodKey]) {
    const variations = COLORWAYS[prodKey];
    for (const color of variations) {
      const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const shortColor = colorSlug.slice(0, 15);
      const shortBase = p.id.replace('flow-gen-', 'fg-');
      const varId = `${shortBase}-${shortColor}`.slice(0, 48);
      const varTitle = `${p.name} (${color})`;
      const varLink = `${p.url}?color=${encodeURIComponent(color)}`;
      const desc = escXml(`Shop official ${varTitle}. Premium quality made-to-order physical merchandise. Durable finish, high-resolution direct print, 30-day money-back guarantee with fast US delivery.`);

      itemsXml += `    <item>
      <g:id>${escXml(varId)}</g:id>
      <g:item_group_id>${escXml(p.id)}</g:item_group_id>
      <g:title>${escXml(varTitle)}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${escXml(varLink)}</g:link>
      <g:image_link>${escXml(p.image)}</g:image_link>
      <g:price>${priceStr}</g:price>
      <g:color>${escXml(color)}</g:color>
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

      totalSkuCount++;
    }
  } else {
    // Spreadshirt base item (single listing with internal variants)
    const desc = escXml(`Official ${p.name} from Urban Clothes Market. Made to order with premium materials. Fast US delivery and hassle-free 30-day returns.`);

    itemsXml += `    <item>
      <g:id>${escXml(p.id || `ucm-${totalSkuCount}`)}</g:id>
      <g:title>${escXml(p.name)}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${escXml(p.url)}</g:link>
      <g:image_link>${escXml(p.image)}</g:image_link>
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

    totalSkuCount++;
  }
}

const feedContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Urban Clothes Market Master Merchant Catalog</title>
    <link>https://www.urbanclothesmarket.com</link>
    <description>Authentic Streetwear, Graphic Apparel, Custom Home Decor &amp; Drinkware</description>
${itemsXml}  </channel>
</rss>`;

fs.writeFileSync('google-merchant-feed.xml', feedContent, 'utf8');
console.log(`Wrote expanded google-merchant-feed.xml (${(feedContent.length / 1024 / 1024).toFixed(2)} MB, ${totalSkuCount} SKU listings).`);

const gzipped = zlib.gzipSync(Buffer.from(feedContent, 'utf8'));
fs.writeFileSync('google-merchant-feed.xml.gz', gzipped);
console.log(`Wrote expanded google-merchant-feed.xml.gz (${(gzipped.length / 1024 / 1024).toFixed(2)} MB).`);
console.log('=== MULTIPLICATION TO MAXIMUM LISTINGS COMPLETED! ===');
