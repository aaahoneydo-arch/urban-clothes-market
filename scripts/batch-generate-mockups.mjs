import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TEMPLATES = {
  'tshirt-black': {
    name: "Classic Streetwear T-Shirt — Jet Black",
    category: "Clothing",
    googleCategory: "1604",
    price: "24.99",
    template: 'assets/mockup-templates/tshirt-black.jpg',
    width: 290,
    height: 310,
    left: 367,
    top: 280,
    isDark: true
  },
  'hoodie-black': {
    name: "Heavyweight Pullover Hoodie — Charcoal Black",
    category: "Clothing",
    googleCategory: "1604",
    price: "49.99",
    template: 'assets/mockup-templates/hoodie-black.jpg',
    width: 260,
    height: 270,
    left: 382,
    top: 340,
    isDark: true
  },
  'tshirt-white': {
    name: "Everyday Crewneck Tee — Pure White",
    category: "Clothing",
    googleCategory: "1604",
    price: "24.99",
    template: 'assets/mockup-templates/tshirt-white.jpg',
    width: 290,
    height: 310,
    left: 367,
    top: 280,
    isDark: false
  },
  'mug-white': {
    name: "Ceramic Coffee Mug (11oz) — Glossy White",
    category: "Gifts & Gear",
    googleCategory: "212",
    price: "16.99",
    template: 'assets/mockup-templates/mug-white.jpg',
    width: 230,
    height: 240,
    left: 340,
    top: 410,
    isDark: false
  },
  'tote-natural': {
    name: "Organic Cotton Canvas Tote Bag — Natural",
    category: "Gifts & Gear",
    googleCategory: "100",
    price: "19.99",
    template: 'assets/mockup-templates/tote-natural.jpg',
    width: 320,
    height: 330,
    left: 352,
    top: 480,
    isDark: false
  },
  'poster-framed': {
    name: "Gallery Framed Art Poster — Exhibition Frame",
    category: "Posters & Wall Art",
    googleCategory: "500044",
    price: "59.99",
    template: 'assets/mockup-templates/poster-framed.jpg',
    width: 290,
    height: 440,
    left: 445,
    top: 275,
    isDark: false
  },
  'pillow-linen': {
    name: "Square Linen Throw Pillow (18x18)",
    category: "Home & Linens",
    googleCategory: "536",
    price: "34.99",
    template: 'assets/mockup-templates/pillow-linen.jpg',
    width: 340,
    height: 340,
    left: 342,
    top: 370,
    isDark: false
  },
  'phonecase-white': {
    name: "Impact Snap Smartphone Case",
    category: "Accessories",
    googleCategory: "1604",
    price: "26.99",
    template: 'assets/mockup-templates/phonecase-white.jpg',
    width: 180,
    height: 290,
    left: 395,
    top: 420,
    isDark: false
  },
  'sticker-diecut': {
    name: "Die-Cut Matte Vinyl Sticker (4-Inch)",
    category: "Novelty & Accessories",
    googleCategory: "505389",
    price: "4.99",
    template: 'assets/mockup-templates/sticker-diecut.jpg',
    width: 340,
    height: 210,
    left: 260,
    top: 385,
    isDark: false
  }
};

const MOCKUP_OUT_DIR = path.resolve('mockups');
if (!fs.existsSync(MOCKUP_OUT_DIR)) fs.mkdirSync(MOCKUP_OUT_DIR, { recursive: true });

// Discover priority 194 files + all remaining vault files
const lookbookDir = path.resolve('public/lookbook');
const allLookbookFiles = fs.readdirSync(lookbookDir);

// Filter flow-gen-*.png (excluding -mockup-transparent)
const flowGenFiles = allLookbookFiles
  .filter(f => /^flow-gen-\d+\.png$/i.test(f))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0], 10);
    const numB = parseInt(b.match(/\d+/)[0], 10);
    return numA - numB;
  });

console.log(`Found ${flowGenFiles.length} total flow-gen artwork designs in vault.`);

// Priority 194 designs: flow-gen-0603.png to flow-gen-0796.png
const priority194 = flowGenFiles.filter(f => {
  const num = parseInt(f.match(/\d+/)[0], 10);
  return num >= 603 && num <= 796;
});

const remainingVault = flowGenFiles.filter(f => {
  const num = parseInt(f.match(/\d+/)[0], 10);
  return num < 603 || num > 796;
});

console.log(`Priority 194 designs count: ${priority194.length}`);
console.log(`Remaining vault designs count: ${remainingVault.length}`);

// Ordered sequence: 194 first, then all remaining
const orderedDesigns = [...priority194, ...remainingVault];

function titleFromFilename(filename) {
  const base = filename.replace(/\.png$/i, '');
  const words = base.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(' ');
}

// Convert near-black pixels to transparent alpha for light products
async function prepareAlphaArtwork(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 30;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (r < threshold && g < threshold && b < threshold) {
      data[i+3] = 0;
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toBuffer();
}

async function processDesign(designFile, index, total) {
  const designPath = path.join(lookbookDir, designFile);
  const baseName = designFile.replace(/\.png$/i, '');
  const designTitle = titleFromFilename(designFile);

  let alphaArtworkBuffer = null;
  let rawArtworkBuffer = null;

  try {
    rawArtworkBuffer = await sharp(designPath).trim().toBuffer();
    alphaArtworkBuffer = await prepareAlphaArtwork(designPath);
  } catch (e) {
    console.error(`Error loading ${designFile}:`, e.message);
    return [];
  }

  const generatedListings = [];

  for (const [prodKey, cfg] of Object.entries(TEMPLATES)) {
    const outFilename = `${baseName}-${prodKey}.webp`;
    const outPath = path.join(MOCKUP_OUT_DIR, outFilename);

    try {
      if (!fs.existsSync(outPath)) {
        let artworkBuffer = cfg.isDark ? rawArtworkBuffer : alphaArtworkBuffer;
        let blend = cfg.isDark ? 'screen' : 'over';

        const resizedArtwork = await sharp(artworkBuffer)
          .resize({
            width: cfg.width,
            height: cfg.height,
            fit: 'inside',
            withoutEnlargement: true
          })
          .toBuffer();

        const artworkMeta = await sharp(resizedArtwork).metadata();
        const actualLeft = Math.round(cfg.left + (cfg.width - artworkMeta.width) / 2);
        const actualTop = Math.round(cfg.top + (cfg.height - artworkMeta.height) / 2);

        await sharp(cfg.template)
          .composite([{
            input: resizedArtwork,
            top: actualTop,
            left: actualLeft,
            blend: blend
          }])
          .webp({ quality: 84 })
          .toFile(outPath);
      }

      // Catalog item record
      const fullTitle = `${designTitle} — ${cfg.name}`;
      const productSlug = `${baseName}-${prodKey}`;
      const publicImageUrl = `https://www.urbanclothesmarket.com/mockups/${outFilename}`;
      const productPageUrl = `https://www.urbanclothesmarket.com/products/${productSlug}/`;

      generatedListings.push({
        id: `ucm-${productSlug}`,
        name: fullTitle,
        design: designTitle,
        productType: cfg.name,
        category: cfg.category,
        googleProductCategory: cfg.googleCategory,
        price: `$${cfg.price}`,
        image: publicImageUrl,
        url: productPageUrl,
        sizes: cfg.category === "Clothing" ? ["S", "M", "L", "XL", "2XL", "3XL"] : ["One Size"],
        colors: cfg.isDark ? ["Black", "Charcoal", "Dark Heather"] : ["White", "Natural", "Ivory"]
      });

    } catch (err) {
      console.error(`Error compositing ${outFilename}:`, err.message);
    }
  }

  if ((index + 1) % 10 === 0 || index === total - 1) {
    console.log(`[${index + 1}/${total}] Processed ${designFile} -> ${generatedListings.length} mockups created.`);
  }

  return generatedListings;
}

async function run() {
  console.log('=== STARTING PHYSICAL MOCKUP GENERATION ENGINE ===');
  console.log(`Phase 1: 194 Priority Designs (${priority194.length})`);
  console.log(`Phase 2: Remaining Vault Designs (${remainingVault.length})`);
  console.log(`Total Designs: ${orderedDesigns.length}`);

  const startTime = Date.now();
  const allListings = [];

  // Run in chunks with concurrency 4
  const CONCURRENCY = 4;
  for (let i = 0; i < orderedDesigns.length; i += CONCURRENCY) {
    const chunk = orderedDesigns.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map((file, idx) => processDesign(file, i + idx, orderedDesigns.length))
    );
    for (const res of chunkResults) {
      allListings.push(...res);
    }

    // Save intermediate checkpoint every 50 designs
    if ((i + CONCURRENCY) % 50 === 0 || i + CONCURRENCY >= orderedDesigns.length) {
      fs.writeFileSync(
        'data/generated-mockup-catalog.json',
        JSON.stringify(allListings, null, 2)
      );
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nCOMPLETED in ${elapsed}s! Total new physical listings: ${allListings.length}`);
  fs.writeFileSync('data/generated-mockup-catalog.json', JSON.stringify(allListings, null, 2));
}

run().catch(console.error);
