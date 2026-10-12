import fs from 'node:fs';

let html = fs.readFileSync('index.html', 'utf8');

const regex = /\/products\/flow-gen-(\d+)-[a-z0-9-]+?-(tshirt-black|hoodie-black|tshirt-white|mug-white|tote-natural|poster-framed|pillow-linen|phonecase-white|sticker-diecut)\/?/g;

let count = 0;
const fixedHtml = html.replace(regex, (match, num, prod) => {
  count++;
  return `/products/flow-gen-${num}-${prod}/`;
});

console.log(`Replaced ${count} compound broken URLs with clean static directory paths.`);

// Verify existence of replaced paths
const links = fixedHtml.match(/\/products\/flow-gen-\d+-(?:tshirt-black|hoodie-black|tshirt-white|mug-white|tote-natural|poster-framed|pillow-linen|phonecase-white|sticker-diecut)\//g) || [];
console.log(`Total valid product links in index.html: ${links.length}`);

let missing = 0;
for (const l of new Set(links)) {
  const dir = l.replace(/^\//, '');
  const file = `${dir}index.html`;
  if (!fs.existsSync(file)) {
    console.warn('Missing file:', file);
    missing++;
  }
}
console.log(`Missing product files on disk: ${missing}`);

if (missing === 0 && count > 0) {
  fs.writeFileSync('index.html', fixedHtml, 'utf8');
  console.log('Successfully updated index.html with 100% verified live product paths!');
}
