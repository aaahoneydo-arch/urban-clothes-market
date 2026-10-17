import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = 'C:/Users/aaaho/.gemini/antigravity-ide/scratch';
const GTM_PATH = 'C:/Users/aaaho/Documents/Codex/2026-10-08/what/work/urban-clothes-market/data/ground_truth_design_map.json';
const GTM = JSON.parse(fs.readFileSync(GTM_PATH, 'utf8'));

// Known OCR corruption / generic patterns
const typoPatterns = [
  /zohopa/i, /mbmentd/i, /lmthal/i, /qrrrrrtnss/i, /spirii/i, /30ez/i,
  /concept\s*#/i, /artwork\s*#/i, /untitled/i, /unknown/i, /test\s*product/i
];

console.log('====================================================');
console.log('   ORIGIN SHOP AUDITOR: PRINTIFY, ZAZZLE, SPREADSHOP, THREADLESS');
console.log('====================================================\n');

// 1. Audit Spreadshop Chunks
let ssErrors = [];
let ssTotal = 0;
const ssFiles = ['spreadshop_chunk1.json', 'spreadshop_chunk2.json', 'spreadshop_chunk3.json', 'spreadshop_chunk4.json'];
for (const cf of ssFiles) {
  const p = path.join(SCRATCH_DIR, cf);
  if (!fs.existsSync(p)) continue;
  const items = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const item of items) {
    ssTotal++;
    const title = item.title || item.name || '';
    for (const pat of typoPatterns) {
      if (pat.test(title)) {
        ssErrors.push({ file: cf, id: item.id || item.articleId, title, issue: 'Matched pattern: ' + pat });
        break;
      }
    }
  }
}
console.log(`[Spreadshop Origin] Audited ${ssTotal} products across 4 chunks.`);
console.log(`[Spreadshop Origin] Irregularities: ${ssErrors.length}`);
if (ssErrors.length > 0) {
  console.log('Sample Spreadshop issues:', ssErrors.slice(0, 5));
}

// 2. Audit Zazzle Catalog
const zzPath = path.join(SCRATCH_DIR, 'zazzle_all_products_catalog.json');
let zzErrors = [];
let zzTotal = 0;
if (fs.existsSync(zzPath)) {
  const zzItems = JSON.parse(fs.readFileSync(zzPath, 'utf8'));
  zzTotal = zzItems.length;
  for (const item of zzItems) {
    const title = item.title || '';
    for (const pat of typoPatterns) {
      if (pat.test(title)) {
        zzErrors.push({ id: item.productId || item.id, title, issue: 'Matched pattern: ' + pat });
        break;
      }
    }
  }
}
console.log(`\n[Zazzle Origin] Audited ${zzTotal} catalog items.`);
console.log(`[Zazzle Origin] Irregularities: ${zzErrors.length}`);
if (zzErrors.length > 0) {
  console.log('Sample Zazzle issues:', zzErrors.slice(0, 5));
}

// 3. Audit Threadless Catalog
const tlPath = path.join(SCRATCH_DIR, 'threadless_all_products_catalog.json');
let tlErrors = [];
let tlTotal = 0;
if (fs.existsSync(tlPath)) {
  const tlItems = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  tlTotal = tlItems.length;
  for (const item of tlItems) {
    const title = item.title || '';
    for (const pat of typoPatterns) {
      if (pat.test(title)) {
        tlErrors.push({ id: item.id, title, issue: 'Matched pattern: ' + pat });
        break;
      }
    }
  }
}
console.log(`\n[Threadless Origin] Audited ${tlTotal} catalog items.`);
console.log(`[Threadless Origin] Irregularities: ${tlErrors.length}`);
if (tlErrors.length > 0) {
  console.log('Sample Threadless issues:', tlErrors.slice(0, 5));
}

// 4. Audit Printify Live Origin
const pfTokenPath = path.join(SCRATCH_DIR, 'printify_api_token.txt');
let pfTotal = 0;
let pfErrors = [];
if (fs.existsSync(pfTokenPath)) {
  const token = fs.readFileSync(pfTokenPath, 'utf8').trim();
  const shopId = 29269499;
  console.log(`\n[Printify Origin] Querying live store ${shopId}...`);
  try {
    let page = 1;
    let allPf = [];
    while (true) {
      const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.data || data.data.length === 0) break;
      allPf.push(...data.data);
      if (page >= data.last_page) break;
      page++;
    }
    pfTotal = allPf.length;
    for (const p of allPf) {
      for (const pat of typoPatterns) {
        if (pat.test(p.title || '')) {
          pfErrors.push({ id: p.id, title: p.title, issue: 'Matched pattern: ' + pat });
          break;
        }
      }
    }
    console.log(`[Printify Origin] Audited ${pfTotal} live products on Printify.`);
    console.log(`[Printify Origin] Irregularities: ${pfErrors.length}`);
    if (pfErrors.length > 0) {
      console.log('Sample Printify issues:', pfErrors.slice(0, 5));
    }
  } catch (e) {
    console.error('[Printify Origin] Error querying live products:', e.message);
  }
}

console.log('\n====================================================');
console.log(`TOTAL ORIGIN ITEMS AUDITED ACROSS SHOPS: ${ssTotal + zzTotal + tlTotal + pfTotal}`);
console.log(`TOTAL IRREGULARITIES DETECTED: ${ssErrors.length + zzErrors.length + tlErrors.length + pfErrors.length}`);
console.log('====================================================');
