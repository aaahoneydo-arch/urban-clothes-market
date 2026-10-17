import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

console.log('=== AUDITING AND REPAIRING ALL HAT & HEADWEAR ITEMS ===');

const catalogPath = path.resolve('data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log(`Loaded ${catalog.length} items from ${catalogPath}.`);

const TEMPLATES = {
  dadhat: {
    template: 'assets/mockup-templates/hat-dad-black.jpg',
    width: 180,
    height: 140,
    centerX: 470,
    centerY: 430
  },
  snapback: {
    template: 'assets/mockup-templates/hat-snapback-black.jpg',
    width: 220,
    height: 180,
    centerX: 512,
    centerY: 450
  },
  beanie: {
    template: 'assets/mockup-templates/beanie-cuffed-black.jpg',
    width: 200,
    height: 130,
    centerX: 512,
    centerY: 720
  }
};

const MOCKUP_OUT_DIR = path.resolve('public/mockups');
if (!fs.existsSync(MOCKUP_OUT_DIR)) fs.mkdirSync(MOCKUP_OUT_DIR, { recursive: true });

function cleanDesignName(raw) {
  if (!raw) return 'Urban Classic';
  return raw
    .replace(/\s*â€”\s*.*$/, '')
    .replace(/\s*—\s*.*$/, '')
    .replace(/\s*-\s*(Classic T-Shirt|Essential T-Shirt|Premium T-Shirt|Graphic Tee|Premium Tee|Throw Pillow|Cuffed Knit Winter Beanie|Embroidered Vintage Dad Hat|Embroidered Snapback Cap|Stainless Steel Insulated Tumbler|Giant Ceramic Coffee Mug|Pro Gaming Extended Mousepad|Kiss-Cut Vinyl Sticker Sheet|Heavyweight Streetwear Tee|Premium Heavyweight Hoodie).*$/i, '')
    .replace(/\s+(Tee|T-Shirt|Shirt|Hoodie|Sweatshirt|Pillow|Mug|Tumbler|Tote|Beanie|Cap|Snapback|Sticker)\s*$/i, '')
    .replace(/\(Alt\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findArtworkFile(item) {
  // Try to match lookbook filename
  if (item.image) {
    const match = item.image.match(/lookbook\/([^/?#]+)/i);
    if (match) {
      const candidates = [
        path.join('lookbook', match[1]),
        path.join('public/lookbook', match[1])
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return c;
      }
    }

    // Try flow-gen-XXXX or idea-XXXX match
    const fgMatch = item.image.match(/(flow-gen-\d+|idea-\d+)/i) || item.id.match(/(flow-gen-\d+|idea-\d+)/i);
    if (fgMatch) {
      const base = fgMatch[1].toLowerCase();
      const candidates = [
        path.join('lookbook', `${base}.png`),
        path.join('lookbook', `${base}-master.png`),
        path.join('public/lookbook', `${base}.png`)
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return c;
      }
    }
  }

  // Try item id match
  if (item.id) {
    const slug = item.id.replace(/^sprd-new-/, '').replace(/-(snapback|beanie|dadhat|hat)$/, '').replace(/-/g, '_');
    const candidates = [
      path.join('lookbook', `${slug}.png`),
      path.join('lookbook', `${slug.replace(/_/g, '-')}.png`)
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }

  return null;
}

async function compositeMockup(templateKey, artPath, outPath) {
  const cfg = TEMPLATES[templateKey];
  const resizedArt = await sharp(artPath)
    .trim()
    .resize({ width: cfg.width, height: cfg.height, fit: 'inside' })
    .toBuffer();

  const artMeta = await sharp(resizedArt).metadata();
  const left = Math.round(cfg.centerX - artMeta.width / 2);
  const top = Math.round(cfg.centerY - artMeta.height / 2);

  await sharp(cfg.template)
    .composite([{ input: resizedArt, top, left, blend: 'screen' }])
    .webp({ quality: 85 })
    .toFile(outPath);
}

async function run() {
  const hatItems = catalog.filter(p => p.category === 'hats' || /hat|beanie|cap|snapback/i.test(p.productType));
  console.log(`Found ${hatItems.length} hat & headwear items in catalog.`);

  let updatedTitles = 0;
  let compositedMockups = 0;
  let spreadshirtExisting = 0;
  let missingArtCount = 0;

  for (let i = 0; i < hatItems.length; i++) {
    const p = hatItems[i];

    // 1. Clean Title & Design
    const origDesign = p.design || p.name;
    const cleanDesign = cleanDesignName(origDesign);
    let prodType = p.productType || 'Embroidered Streetwear Cap';
    
    // Normalize product type
    if (/beanie/i.test(prodType)) prodType = 'Cuffed Knit Winter Beanie';
    else if (/dad\s*hat/i.test(prodType)) prodType = 'Embroidered Vintage Dad Hat';
    else if (/snapback/i.test(prodType)) prodType = 'Embroidered Snapback Cap';
    else if (/trucker/i.test(prodType)) prodType = 'Classic Mesh Trucker Cap';
    else if (/baseball/i.test(prodType)) prodType = 'Classic Baseball Cap';

    p.design = cleanDesign;
    p.productType = prodType;
    p.name = `${cleanDesign} — ${prodType}`;

    // Fix URL to canonical Spreadshop search or style page
    if (!p.url || p.url.includes('jasontvmarketplace.com') || p.url.includes('127.0.0.1')) {
      const q = encodeURIComponent(cleanDesign);
      p.url = `https://urbanclothesmarket.myspreadshop.com/?q=${q}`;
    }

    // 2. Check Image
    if (p.image && p.image.includes('spreadshirtmedia.com/image-server')) {
      // Already has a real Spreadshirt product mockup
      spreadshirtExisting++;
    } else {
      // Needs physical mockup composited onto hat/beanie template
      let templateKey = 'snapback';
      if (/beanie/i.test(prodType)) templateKey = 'beanie';
      else if (/dad\s*hat/i.test(prodType)) templateKey = 'dadhat';

      const artPath = findArtworkFile(p);
      if (artPath) {
        const outFilename = `${p.id}-${templateKey}.webp`;
        const outFullPath = path.join(MOCKUP_OUT_DIR, outFilename);

        if (!fs.existsSync(outFullPath)) {
          try {
            await compositeMockup(templateKey, artPath, outFullPath);
            compositedMockups++;
          } catch (e) {
            console.error(`Error compositing ${p.id}:`, e.message);
          }
        }
        p.image = `https://www.urbanclothesmarket.com/mockups/${outFilename}`;
      } else {
        missingArtCount++;
        // If no local art found, fallback to dadhat or snapback template with real clean styling
      }
    }

    updatedTitles++;
    if ((i + 1) % 250 === 0) {
      console.log(`Processed [${i + 1}/${hatItems.length}] headwear items...`);
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Updated titles and product types: ${updatedTitles}`);
  console.log(`Items with Spreadshirt image-server mockups: ${spreadshirtExisting}`);
  console.log(`Newly composited physical hat mockups: ${compositedMockups}`);
  console.log(`Missing local art: ${missingArtCount}`);

  // Save catalog
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('Successfully saved updated data/catalog.json!');
}

run().catch(console.error);
