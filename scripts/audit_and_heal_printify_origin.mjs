import fs from 'fs';
import path from 'path';

console.log('=== AUDITING AND HEALING PRINTIFY ORIGIN SHOP (29269499) ===');

const tokenPath = 'C:/Users/aaaho/.gemini/antigravity-ide/scratch/printify_api_token.txt';
if (!fs.existsSync(tokenPath)) {
  console.error('Printify token not found!');
  process.exit(1);
}
const token = fs.readFileSync(tokenPath, 'utf8').trim();
const SHOP_ID = 29269499;

const groundTruthPath = path.resolve('data/ground_truth_design_map.json');
const groundTruth = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));

// Curated dictionary for raw OCR strings
const OCR_CORRECTIONS = {
  'Zohopa Remed': 'Apothecary Remedy Potion Flask & Serpent',
  'Remedx Lmthal': 'Lethal Remedy Witch Poison Flask & Skull',
  'Morl Mbmentd': 'Memento Mori Winged Crowned Skeleton Hourglass',
  'Explorer Qrrrrrtnss': 'National Wilderness Park Explorer Mountain Crest',
  'Lekncio Lucky': 'Lucky Ace Vintage Playing Card Tattoo',
  'Neversrz Paro He': 'Never Surrender Spartan Battle Helmet',
  'Urban Concept #1': 'Death Before Decaf Grim Reaper Pour-Over',
  'Urban Concept #2': 'Lowrider Classic Impala Low & Slow',
  'Urban Vision #1': 'Death Before Decaf Grim Reaper Pour-Over',
  'Urban Vision #2': 'Lowrider Classic Impala Low & Slow',
  '30ez Nlie': 'Vintage 300Z Japanese Street Racer',
  'spirii Kitsung': 'Spirit Kitsune Nine-Tailed Japanese Fox',
  'Insert coin Continue T0 Inseri Coin': 'Insert Coin to Continue Retro Arcade Classic',
  'Lowrider Llassic': 'Lowrider Classic Boulevard Cruiser'
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.printify.com/v1${endpoint}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'UCM-Origin-Auditor/1.0'
        }
      };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(url, options);

      if (res.status === 429) {
        console.log(`[Rate Limit] 429 on ${endpoint}, waiting 5s...`);
        await sleep(5000);
        continue;
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API ${method} ${endpoint} returned ${res.status}: ${errText}`);
      }
      return await res.json();
    } catch (e) {
      if (attempt === 5) throw e;
      await sleep(2000);
    }
  }
}

async function runAudit() {
  console.log('Fetching all live products from Printify Shop ID:', SHOP_ID);
  let page = 1;
  let allProducts = [];

  while (true) {
    const res = await apiRequest(`/shops/${SHOP_ID}/products.json?limit=50&page=${page}`);
    if (!res.data || res.data.length === 0) break;
    allProducts.push(...res.data);
    console.log(`Fetched page ${page} (${allProducts.length} total products so far)...`);
    page++;
    await sleep(500);
  }

  console.log(`\nAuditing ${allProducts.length} live products on Printify...`);
  let healedCount = 0;
  let skippedClean = 0;
  const receipts = [];

  for (const p of allProducts) {
    let needsUpdate = false;
    let newTitle = p.title;
    let designName = null;

    // Check against known OCR corrections
    for (const [badStr, goodStr] of Object.entries(OCR_CORRECTIONS)) {
      if (p.title.includes(badStr)) {
        newTitle = p.title.replace(badStr, goodStr);
        designName = goodStr;
        needsUpdate = true;
        break;
      }
    }

    // Check for raw unreadable patterns like Qrrrr or all caps gibberish
    if (!needsUpdate && (p.title.includes('Qrrrr') || p.title.includes('Mbmentd') || p.title.includes('Lmthal') || p.title.includes('Zohopa'))) {
      needsUpdate = true;
      newTitle = p.title
        .replace(/Explorer Qrrrrrtnss Wilderness National Park/gi, 'National Wilderness Park Explorer Mountain Crest')
        .replace(/Morl Mbmentd/gi, 'Memento Mori Winged Crowned Skeleton Hourglass')
        .replace(/Remedx Lmthal/gi, 'Lethal Remedy Witch Poison Flask & Skull')
        .replace(/Zohopa Remed/gi, 'Apothecary Remedy Potion Flask & Serpent');
    }

    if (needsUpdate && newTitle !== p.title) {
      console.log(`[Heal Discrepancy] ID: ${p.id}`);
      console.log(`  OLD: "${p.title}"`);
      console.log(`  NEW: "${newTitle}"`);

      // Clean tags
      const cleanDesign = designName || newTitle.split('|')[0].split('-')[0].trim();
      const tags = Array.from(new Set([
        cleanDesign.slice(0, 25),
        'Urban Clothes Market',
        'Original Graphic',
        'Streetwear',
        ...(p.tags || [])
      ])).filter(t => !Object.keys(OCR_CORRECTIONS).some(bad => t.includes(bad)));

      try {
        await apiRequest(`/shops/${SHOP_ID}/products/${p.id}.json`, 'PUT', {
          title: newTitle,
          tags
        });
        healedCount++;
        receipts.push({ id: p.id, oldTitle: p.title, newTitle });
        console.log(`  ✓ Successfully updated on Printify!`);
      } catch (err) {
        console.error(`  ✗ Error updating product ${p.id}:`, err.message);
      }
      await sleep(1000);
    } else {
      skippedClean++;
    }
  }

  console.log(`\n=== PRINTIFY ORIGIN AUDIT COMPLETE ===`);
  console.log(`Total Products Audited: ${allProducts.length}`);
  console.log(`Healed & Updated Live: ${healedCount}`);
  console.log(`Clean & Compliant: ${skippedClean}`);

  fs.writeFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/printify_origin_heal_receipts.json', JSON.stringify(receipts, null, 2));
}

runAudit().catch(err => console.error('Fatal audit error:', err));
