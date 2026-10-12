import fs from 'node:fs';
import path from 'node:path';

const allDirs = new Set(fs.readdirSync('products'));
const allDirsArray = Array.from(allDirs);

function findMatch(brokenLink) {
  const clean = brokenLink.replace(/^\/products\//, '').replace(/\/$/, '');
  if (allDirs.has(clean)) return '/products/' + clean + '/';

  // Extract ID from end, e.g. -2376, -175, -1359
  const parts = clean.split('-');
  const id = parts[parts.length - 1];
  const designPrefix = parts.slice(0, 3).join('-');

  const matches = allDirsArray.filter(d => d.startsWith(designPrefix) && d.endsWith('-' + id));
  if (matches.length > 0) return '/products/' + matches[0] + '/';

  const anyIdMatches = allDirsArray.filter(d => d.endsWith('-' + id));
  if (anyIdMatches.length > 0) return '/products/' + anyIdMatches[0] + '/';

  return null;
}

// 1. Helper to create category/collection pages if missing
function ensureCategoryPage(dirPath, title, eyebrow, h1, leadText, filterFn) {
  const file = path.join(dirPath, 'index.html');
  if (fs.existsSync(file)) return;
  fs.mkdirSync(dirPath, { recursive: true });

  // Use types/tees/index.html as a template
  const template = fs.readFileSync('types/tees/index.html', 'utf8');

  let updated = template
    .replace(/<title>.*?<\/title>/, `<title>${title} | Urban Clothes Market</title>`)
    .replace(/<link rel="canonical" href="https:\/\/www\.urbanclothesmarket\.com\/types\/tees\/">/, `<link rel="canonical" href="https://www.urbanclothesmarket.com/${dirPath}/">`)
    .replace(/<div class="eyebrow">.*?<\/div>/, `<div class="eyebrow">${eyebrow}</div>`)
    .replace(/<h1>.*?<\/h1>/, `<h1>${h1}</h1>`)
    .replace(/<p>Explore over 18,000\+ original graphic tees.*?<\/p>/, `<p>${leadText}</p>`);

  fs.writeFileSync(file, updated);
  console.log(`Created ${file}`);
}

ensureCategoryPage(
  'types/tech',
  'Graphic Phone Cases & Impact Tech Accessories',
  'IMPACT RESISTANT TECH GEAR',
  'Graphic Phone Cases &amp; Tech Accessories',
  'Discover dual-layer impact protective phone cases, laptop sleeves, and gaming desk pads featuring authentic graphic designs.'
);

ensureCategoryPage(
  'types/stationery',
  'Graphic Spiral Notebooks & Daily Journals',
  'ARCHIVAL STATIONERY & NOTEBOOKS',
  'Graphic Notebooks, Journals &amp; Desk Gear',
  'Shop 120-page ruled hardcover notebooks, sketch journals, and creative writing pads featuring original graphic art.'
);

ensureCategoryPage(
  'collections/tarot',
  'Tarot & Mystical Graphic Apparel and Gifts',
  'MYSTICAL ARCHETYPES & ESOTERIC ART',
  'Tarot &amp; Mystical Graphic Collection',
  'Immerse in iconic Major Arcana tarot archetypes, celestial moon phases, and esoteric mystical art across tees, hoodies, and accessories.'
);

ensureCategoryPage(
  'collections/fantasy',
  'Dark Fantasy & Gothic Graphic Streetwear',
  'DARK FANTASY & MYTHICAL LEGENDS',
  'Dark Fantasy &amp; Gothic Graphic Collection',
  'Explore intricate dark fantasy illustrations, mythical dragons, gothic chapels, and abyssal armor on heavyweight streetwear.'
);

ensureCategoryPage(
  'collections/cyber',
  'Cyberpunk & Sci-Fi Graphic Streetwear',
  'FUTURISTIC NEON & CYBER STREETS',
  'Cyberpunk &amp; Sci-Fi Graphic Collection',
  'Step into neon cityscapes, cybernetic mechs, and retro synthwave aesthetics with durable graphic apparel and art.'
);

ensureCategoryPage(
  'collections/streetwear',
  'Urban Streetwear & Underground Racing Graphics',
  'RAW CITY ENERGY & RETRO RACING',
  'Urban Streetwear &amp; Vintage Racing Collection',
  'Shop raw metropolitan typography, nighttime racing graphics, and heavyweight streetwear essentials.'
);

// 2. Fix broken product links across all storefront pages
const pagesToAudit = [
  'index.html',
  'about/index.html',
  'privacy/index.html',
  'returns/index.html',
  'shipping/index.html',
  'types/tees/index.html',
  'types/hoodies/index.html',
  'types/mugs/index.html',
  'types/hats/index.html',
  'types/art/index.html',
  'types/tech/index.html',
  'types/stickers/index.html',
  'types/bags/index.html',
  'collections/all/index.html',
  'collections/cats/index.html',
  'collections/dogs/index.html',
  'collections/gamers/index.html',
  'collections/cars/index.html',
  'collections/humor/index.html'
];

let totalFixed = 0;

for (const relPage of pagesToAudit) {
  if (!fs.existsSync(relPage)) continue;
  let html = fs.readFileSync(relPage, 'utf8');
  let pageFixed = 0;

  const hrefMatches = html.match(/href="(\/products\/[^"#?]+)/g) || [];
  for (const m of hrefMatches) {
    const rawLink = m.replace(/^href="/, '');
    const cleanLink = rawLink.endsWith('/') ? rawLink : rawLink + '/';
    const targetDir = cleanLink.replace(/^\//, '');
    const targetFile = path.resolve(targetDir, 'index.html');

    if (!fs.existsSync(targetFile)) {
      const match = findMatch(cleanLink);
      if (match) {
        // replace exact occurrence
        const searchPattern = new RegExp(rawLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        html = html.replace(searchPattern, match);
        pageFixed++;
      } else {
        console.warn(`Could not find match for broken link: ${cleanLink} in ${relPage}`);
      }
    }
  }

  if (pageFixed > 0) {
    fs.writeFileSync(relPage, html);
    console.log(`Fixed ${pageFixed} broken links in ${relPage}`);
    totalFixed += pageFixed;
  }
}

console.log(`\nDONE: Successfully repaired ${totalFixed} link occurrences across storefront!`);
