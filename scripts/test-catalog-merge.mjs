import fs from 'node:fs';
import path from 'node:path';
import { normalize } from '../src/catalog-core.mjs';

const existing = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
console.log('Existing catalog count:', existing.length);

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

// Find verified classic tees
const tees = all.filter(p => 
  p.id && 
  p.id.endsWith('-m-ts-cla') && 
  p.image_link && 
  !p.image_link.includes('mockup-preview') && 
  allPubIds.has(String(p.design_id))
);

console.log('Candidate published tees with real CDN mockups:', tees.length);

const additions = [];
for (const t of tees) {
  const newId = 'threadless-' + t.design_id;
  if (existingIds.has(newId)) continue;
  existingIds.add(newId);

  // Clean design name from title (remove " - Men's Classic T-Shirt")
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

console.log('New additions to merge:', additions.length);

const combined = [...existing, ...additions];
console.log('Testing normalization on combined catalog of', combined.length, 'records...');

try {
  const normalized = normalize(combined);
  console.log('SUCCESS! Normalized', normalized.length, 'products without any errors.');
} catch (err) {
  console.error('FAILED normalization:', err.message);
  process.exit(1);
}
