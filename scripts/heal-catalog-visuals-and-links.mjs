import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

console.log('=== SYSTEMATIC CATALOG HEALING: VISUALS, TITLES & STORE LINKS ===');

const catalogPath = path.resolve('data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log(`Loaded ${catalog.length} items from ${catalogPath}.`);

const TEMPLATES = {
  'tshirt-black': {
    template: 'assets/mockup-templates/tshirt-black.jpg',
    width: 290,
    height: 310,
    centerX: 512,
    centerY: 435,
    blend: 'screen'
  },
  'hoodie-black': {
    template: 'assets/mockup-templates/hoodie-black.jpg',
    width: 260,
    height: 270,
    centerX: 512,
    centerY: 475,
    blend: 'screen'
  },
  'tshirt-white': {
    template: 'assets/mockup-templates/tshirt-white.jpg',
    width: 290,
    height: 310,
    centerX: 512,
    centerY: 435,
    blend: 'over'
  },
  'mug-white': {
    template: 'assets/mockup-templates/mug-white.jpg',
    width: 230,
    height: 240,
    centerX: 455,
    centerY: 530,
    blend: 'over'
  },
  'tote-natural': {
    template: 'assets/mockup-templates/tote-natural.jpg',
    width: 320,
    height: 330,
    centerX: 512,
    centerY: 645,
    blend: 'over'
  },
  'poster-framed': {
    template: 'assets/mockup-templates/poster-framed.jpg',
    width: 290,
    height: 440,
    centerX: 590,
    centerY: 495,
    blend: 'over'
  },
  'pillow-linen': {
    template: 'assets/mockup-templates/pillow-linen.jpg',
    width: 340,
    height: 340,
    centerX: 512,
    centerY: 540,
    blend: 'over'
  },
  'phonecase-white': {
    template: 'assets/mockup-templates/phonecase-white.jpg',
    width: 180,
    height: 290,
    centerX: 485,
    centerY: 565,
    blend: 'over'
  },
  'sticker-diecut': {
    template: 'assets/mockup-templates/sticker-diecut.jpg',
    width: 340,
    height: 210,
    centerX: 430,
    centerY: 490,
    blend: 'over'
  },
  'dadhat': {
    template: 'assets/mockup-templates/hat-dad-black.jpg',
    width: 180,
    height: 140,
    centerX: 470,
    centerY: 430,
    blend: 'screen'
  },
  'snapback': {
    template: 'assets/mockup-templates/hat-snapback-black.jpg',
    width: 220,
    height: 180,
    centerX: 512,
    centerY: 450,
    blend: 'screen'
  },
  'beanie': {
    template: 'assets/mockup-templates/beanie-cuffed-black.jpg',
    width: 200,
    height: 130,
    centerX: 512,
    centerY: 720,
    blend: 'screen'
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

function resolveProductKey(productType, category) {
  const t = (productType || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (/hoodie|sweatshirt|pullover/i.test(t)) return 'hoodie-black';
  if (/beanie/i.test(t)) return 'beanie';
  if (/dad\s*hat|baseball/i.test(t)) return 'dadhat';
  if (/snapback|trucker|hat|cap/i.test(t) || c === 'hats') return 'snapback';
  if (/mug|drinkware|tumbler|bottle/i.test(t) || c === 'mugs') return 'mug-white';
  if (/pillow|cushion/i.test(t)) return 'pillow-linen';
  if (/tote|bag|backpack/i.test(t) || c === 'bags') return 'tote-natural';
  if (/phone|case|tech/i.test(t) || c === 'tech') return 'phonecase-white';
  if (/sticker|pin|decal/i.test(t) || c === 'stickers') return 'sticker-diecut';
  if (/poster|canvas|art|print/i.test(t) || c === 'art') return 'poster-framed';
  if (/white\s*tee|white\s*t-shirt/i.test(t)) return 'tshirt-white';
  return 'tshirt-black';
}

let healedImages = 0;
let healedUrls = 0;
let healedTitles = 0;

for (let i = 0; i < catalog.length; i++) {
  const p = catalog[i];

  // 1. HEAL TITLE & DESIGN
  const cleanDesign = cleanDesignName(p.design || p.name);
  p.design = cleanDesign;
  if (p.name) {
    p.name = p.name.replace(/â€”/g, '—').replace(/Â·/g, '·').replace(/â€/g, '');
    // If title is cross-contaminated (e.g. Tee design on Beanie)
    if (p.productType && !p.name.includes(p.productType)) {
      p.name = `${cleanDesign} — ${p.productType}`;
      healedTitles++;
    }
  }

  // 2. HEAL OUTBOUND URLS
  if (!p.url || p.url.includes('127.0.0.1') || p.url.includes('localhost') || p.url.includes('jasontvmarketplace.com') || p.url.trim() === '' || p.url === '#') {
    const q = encodeURIComponent(cleanDesign);
    if (p.brand === 'Zazzle' || (p.id && p.id.startsWith('ucm-zzl-'))) {
      p.url = `https://www.zazzle.com/store/urbanclothes/products?ps=204&st=popularity&q=${q}`;
    } else {
      p.url = `https://urbanclothesmarket.myspreadshop.com/?q=${q}`;
    }
    healedUrls++;
  }

  // 3. HEAL PRODUCT IMAGES & MOCKUPS
  const needsImageHealing = !p.image ||
    p.image.includes('127.0.0.1') ||
    p.image.includes('localhost') ||
    p.image.includes('jasontvmarketplace.com') ||
    p.image.includes('transparent') ||
    p.image.includes('master.png');

  if (needsImageHealing) {
    const pKey = resolveProductKey(p.productType, p.category);
    // Check if flow-gen match
    const fgMatch = (p.image || '').match(/flow-gen-(\d+)/i) || (p.id || '').match(/flow-gen-(\d+)/i);
    if (fgMatch) {
      const padNum = fgMatch[1].padStart(4, '0');
      const candidateMockup = `flow-gen-${padNum}-${pKey}.webp`;
      const candidatePath = path.join(MOCKUP_OUT_DIR, candidateMockup);

      if (fs.existsSync(candidatePath)) {
        p.image = `https://www.urbanclothesmarket.com/mockups/${candidateMockup}`;
        healedImages++;
      } else {
        // Fallback to black tee or existing flow mockup
        const altMockup = `flow-gen-${padNum}-tshirt-black.webp`;
        if (fs.existsSync(path.join(MOCKUP_OUT_DIR, altMockup))) {
          p.image = `https://www.urbanclothesmarket.com/mockups/${altMockup}`;
          healedImages++;
        }
      }
    } else if (p.image && p.image.includes('127.0.0.1')) {
      // Clean local port to public domain
      p.image = p.image.replace(/http:\/\/127\.0\.0\.1:\d+\//, 'https://urbanclothesmarket.com/lookbook/');
      healedImages++;
    } else if (p.image && p.image.includes('jasontvmarketplace.com')) {
      p.image = p.image.replace('https://jasontvmarketplace.com/assets/merch/', 'https://urbanclothesmarket.com/lookbook/');
      healedImages++;
    }
  }
}

console.log(`\n=== HEALING SUMMARY ===`);
console.log(`Healed corrupted titles & designs: ${healedTitles}`);
console.log(`Healed outbound store & checkout URLs: ${healedUrls}`);
console.log(`Healed product mockups & images: ${healedImages}`);

// Save healed catalog
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Saved healed data/catalog.json successfully!');
