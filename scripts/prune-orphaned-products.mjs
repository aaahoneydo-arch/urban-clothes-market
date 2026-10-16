import fs from 'fs';
import path from 'path';

console.log('--- Pruning Orphaned Product Pages to Satisfy GitHub Pages Limit (<250,000 files) ---');
const catalogPath = path.resolve('data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const validSlugs = new Set();
for (const p of catalog) {
  if (p.path) {
    const slug = p.path.replace(/^\/products\//, '').replace(/\/$/, '').trim();
    if (slug) validSlugs.add(slug);
  }
}
console.log(`Active catalog items: ${catalog.length}`);
console.log(`Active unique slugs: ${validSlugs.size}`);

const productsDir = path.resolve('products');
if (!fs.existsSync(productsDir)) {
  console.log('No products directory found.');
  process.exit(0);
}

const diskDirs = fs.readdirSync(productsDir);
console.log(`Total directories on disk: ${diskDirs.length}`);

const toDelete = [];
for (const dirName of diskDirs) {
  if (!validSlugs.has(dirName)) {
    toDelete.push(dirName);
  }
}

console.log(`Orphaned directories to remove: ${toDelete.length}`);
console.log(`Valid directories to preserve: ${diskDirs.length - toDelete.length}`);

let deletedCount = 0;
const total = toDelete.length;
const start = Date.now();

for (let i = 0; i < total; i++) {
  const targetDir = path.join(productsDir, toDelete[i]);
  try {
    fs.rmSync(targetDir, { recursive: true, force: true });
    deletedCount++;
  } catch (err) {
    console.error(`Error deleting ${targetDir}:`, err.message);
  }

  if (deletedCount % 10000 === 0 || i === total - 1) {
    const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
    const pct = ((deletedCount / total) * 100).toFixed(1);
    console.log(`Progress: ${deletedCount}/${total} (${pct}%) deleted in ${elapsedSec}s...`);
  }
}

console.log(`Successfully removed ${deletedCount} orphaned directories.`);
console.log(`Remaining disk directories: ${fs.readdirSync(productsDir).length}`);
