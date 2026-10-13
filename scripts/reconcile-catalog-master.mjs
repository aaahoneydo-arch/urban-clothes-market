import fs from 'node:fs';
import path from 'node:path';

console.log('=== RECONCILING CATALOG MASTER (13,844 PRODUCTS) ===');

const catalogPath = path.resolve('data/catalog.json');
const backupPath = path.resolve('data/catalog.backup-pre-reconcile.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
fs.writeFileSync(backupPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Saved backup to ${backupPath}. Processing ${catalog.length} items...`);

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

const seenIds = new Set();
let spreadCount = 0;

for (let i = 0; i < catalog.length; i++) {
  const p = catalog[i];
  
  if (!p.id) {
    spreadCount++;
    let sellable = '';
    try {
      sellable = new URL(p.url).searchParams.get('sellable') || '';
    } catch (e) {}
    
    const nameSlug = (p.name || 'item')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 24);
      
    const rawId = `ucm-${nameSlug}-${sellable || ('item' + i)}`;
    let finalId = rawId.substring(0, 48).replace(/-$/, '');
    
    // Ensure uniqueness
    let counter = 1;
    while (seenIds.has(finalId)) {
      finalId = `ucm-${nameSlug.substring(0, 20)}-${sellable || i}-${counter}`.substring(0, 48);
      counter++;
    }
    
    p.id = finalId;
    p.supplierUrl = p.url;
    p.productType = p.productType || p.name.split(' - ')[1] || 'Graphic Apparel';
    p.category = p.category || (getGoogleCategory(p.name) === '1604' ? 'Clothing' : 'Accessories');
    p.googleProductCategory = p.googleProductCategory || getGoogleCategory(p.name);
    
    const slug = p.id.replace(/^ucm-/, '');
    p.url = `https://www.urbanclothesmarket.com/products/${slug}/`;
    
    if (!p.description) {
      p.description = `Shop the official ${p.name} from Urban Clothes Market. Authentic custom made-to-order graphic physical merchandise with fast US shipping and 30-day return policy.`;
    }
  } else {
    const slug = p.id.replace(/^ucm-/, '');
    p.url = `https://www.urbanclothesmarket.com/products/${slug}/`;
  }
  
  seenIds.add(p.id);
}

console.log(`Reconciled ${spreadCount} items lacking IDs. Total unique IDs: ${seenIds.size}`);
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Successfully updated data/catalog.json');
