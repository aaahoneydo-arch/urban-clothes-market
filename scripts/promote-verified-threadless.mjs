import fs from 'node:fs';
import path from 'node:path';
import { normalize } from '../src/catalog-core.mjs';

const catalogPath = path.resolve('data/catalog.json');
const backupPath = path.resolve('data/catalog.json.bak-6722');

const existing = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log('[Promote] Existing catalog records:', existing.length);

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, JSON.stringify(existing, null, 2));
  console.log('[Promote] Created safe backup:', backupPath);
}

const all = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_all_products_catalog.json', 'utf8'));
const audit = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_live_audit_raw.json', 'utf8'));
const log = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_published_log.json', 'utf8'));

const pubAuditIds = new Set(audit.items.filter(i => i.published).map(i => String(i.threadless_id)));
const allPubIds = new Set([...pubAuditIds, ...log.published.map(p => String(p.threadless_id))]);

const existingIds = new Set();
for (const p of existing) {
  const url = new URL(p.url);
  const id = p.store === 'Spreadshop' ? url.searchParams.get('sellable') : p.id;
  existingIds.add(id);
}

const tees = all.filter(p => 
  p.id && 
  p.id.endsWith('-m-ts-cla') && 
  p.image_link && 
  !p.image_link.includes('mockup-preview') && 
  allPubIds.has(String(p.design_id))
);

console.log('[Promote] Candidate published tees with real CDN mockups:', tees.length);

const additions = [];
for (const t of tees) {
  const newId = 'threadless-' + t.design_id;
  if (existingIds.has(newId)) continue;
  existingIds.add(newId);

  const designName = t.title.replace(/\s*-\s*Men['’]s Classic T-Shirt$/i, '').trim();
  additions.push({
    id: newId,
    design: designName,
    productType: "Classic T-Shirt",
    name: `${designName} - Classic T-Shirt`,
    url: t.link,
    image: t.image_link,
    sourceImage: t.image_link,
    store: "Threadless",
    sourceDate: "2026-10-14"
  });
}

console.log('[Promote] Net new verified Threadless additions:', additions.length);

const combined = [...existing, ...additions];
const normalized = normalize(combined);
console.log('[Promote] Successfully normalized full combined catalog:', normalized.length, 'products.');

fs.writeFileSync(catalogPath, JSON.stringify(combined, null, 2));
console.log('[Promote] Updated data/catalog.json successfully written!');
