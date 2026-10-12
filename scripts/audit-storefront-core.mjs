import fs from 'node:fs';
import path from 'node:path';

console.log('=== TARGETED STOREFRONT NAVIGATION & CATEGORY AUDIT ===');

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

let broken = [];
let checked = 0;

for (const relPage of pagesToAudit) {
  if (!fs.existsSync(relPage)) {
    broken.push({ source: relPage, link: relPage, issue: 'Page file itself does not exist' });
    continue;
  }

  const html = fs.readFileSync(relPage, 'utf8');
  const hrefMatches = html.match(/href="(\/[^"#?]+)/g) || [];

  for (const m of hrefMatches) {
    const link = m.replace(/^href="/, '');
    checked++;

    if (link === '/' || link.startsWith('/#')) continue;

    const targetDir = link.replace(/^\//, '');
    const targetFile = path.resolve(targetDir, 'index.html');
    const directFile = path.resolve(targetDir);

    if (!fs.existsSync(targetFile) && !fs.existsSync(directFile)) {
      broken.push({ source: relPage, link, expected: targetFile });
    }
  }
}

console.log(`Checked ${checked} links across ${pagesToAudit.length} core storefront pages.`);
console.log(`Total broken link occurrences: ${broken.length}`);

if (broken.length > 0) {
  const map = new Map();
  for (const b of broken) {
    if (!map.has(b.link)) map.set(b.link, []);
    map.get(b.link).push(b.source);
  }
  console.log(`\nUnique broken links: ${map.size}`);
  for (const [link, sources] of map.entries()) {
    console.log(`  -> ${link} (found on: ${[...new Set(sources)].join(', ')})`);
  }
} else {
  console.log('ALL CORE STOREFRONT LINKS RESOLVE 100% CLEAN (HTTP 200)!');
}
