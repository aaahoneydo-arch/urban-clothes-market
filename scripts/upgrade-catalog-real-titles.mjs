import fs from 'node:fs';
import path from 'node:path';

console.log('=== UPGRADING ALL CATALOG TITLES & DESCRIPTIONS WITH REAL CREATIVE NAMES ===');

// 1. Load real design names map
const realNames = JSON.parse(fs.readFileSync('data/flow-design-names.json', 'utf8'));

// Clean design name helper
function cleanDesignTitle(raw) {
  if (!raw) return 'Urban Streetwear Masterpiece';
  return raw
    .replace(/\s*—\s*.*$/, '')
    .replace(/\s*-\s*(Classic T-Shirt|Essential T-Shirt|Premium T-Shirt|Pullover Hoodie|Lightweight Hoodie|Zipped Hoodie|Crewneck Sweatshirt|Long Sleeve|Tank Top|Coffee Mug|Art Print|Canvas|Framed Print|Throw Pillow|Tote Bag|Sticker).*$/i, '')
    .replace(/\s+(Tee|Hoodie|Mug|Poster|Sticker|Pillow|Tote|Case)\s*$/i, '')
    .replace(/\(Alt\)/gi, '')
    .trim();
}

function generateRichDescription(designTitle, productType, category) {
  return `Shop the official ${designTitle} ${productType} from Urban Clothes Market. Featuring the original "${designTitle}" graphic artwork, printed with high-definition precision and vibrant fade-resistant inks. Crafted for all-day comfort and long-lasting durability, whether worn on the street or styled for daily life. Premium physical made-to-order merchandise backed by a 30-day money-back guarantee with fast US delivery.`;
}

// 2. Load catalog
const catalogPath = path.resolve('data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log(`Loaded ${catalog.length} items from ${catalogPath}.`);

let upgradedCount = 0;

for (const p of catalog) {
  const match = p.id?.match(/flow-gen-(\d+)/) || p.url?.match(/flow-gen-(\d+)/);
  if (match) {
    const num = match[1];
    const pad = String(num).padStart(4, '0');
    const rawDesign = realNames[pad] || realNames[String(parseInt(num, 10))];
    const realDesign = cleanDesignTitle(rawDesign) || `Streetwear Series ${pad}`;

    // Clean product type from existing name or prodKey
    let prodType = p.productType || 'Physical Merchandise';
    if (/tshirt-black/i.test(p.id)) prodType = 'Classic Streetwear T-Shirt (Jet Black)';
    else if (/hoodie-black/i.test(p.id)) prodType = 'Heavyweight Pullover Hoodie (Charcoal Black)';
    else if (/tshirt-white/i.test(p.id)) prodType = 'Everyday Crewneck Tee (Pure White)';
    else if (/mug-white/i.test(p.id)) prodType = 'Ceramic Coffee Mug 11oz (Glossy White)';
    else if (/tote-natural/i.test(p.id)) prodType = 'Organic Cotton Canvas Tote Bag (Natural)';
    else if (/poster-framed/i.test(p.id)) prodType = 'Gallery Framed Art Poster (Exhibition Frame)';
    else if (/pillow-linen/i.test(p.id)) prodType = 'Square Linen Throw Pillow 18x18 (Natural Linen)';
    else if (/phonecase-white/i.test(p.id)) prodType = 'Impact Snap Smartphone Case';
    else if (/sticker-diecut/i.test(p.id)) prodType = 'Die-Cut Matte Vinyl Sticker (4-Inch)';

    p.design = realDesign;
    p.productType = prodType;
    p.name = `${realDesign} — ${prodType}`;
    p.description = generateRichDescription(realDesign, prodType, p.category);

    upgradedCount++;
  }
}

console.log(`Upgraded ${upgradedCount} items with authentic creative titles and rich descriptions.`);

// Save upgraded catalog
fs.writeFileSync('data/catalog.json', JSON.stringify(catalog, null, 2), 'utf8');
console.log('Saved data/catalog.json successfully.');

// Print sample upgraded items
console.log('\nSample Upgraded Items:');
for (const p of catalog.slice(0, 10)) {
  console.log(`- ${p.name}`);
  console.log(`  Design: ${p.design}`);
  console.log(`  Desc: ${p.description.slice(0, 100)}...`);
}
