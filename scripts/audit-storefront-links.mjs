import fs from 'node:fs';
import path from 'node:path';

console.log('=== COMPREHENSIVE STOREFRONT LINK AUDIT ===');

function findHtmlFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(full, list);
    } else if (entry.name.endsWith('.html')) {
      list.push(full);
    }
  }
  return list;
}

const htmlFiles = findHtmlFiles('.');
console.log(`Found ${htmlFiles.length} HTML files to audit.`);

let totalLinksChecked = 0;
let brokenLinks = [];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Match href="/..."
  const regex = /href="(\/[^"#?]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const link = match[1];
    totalLinksChecked++;

    // Ignore asset links or external or anchor
    if (link.startsWith('/#') || link === '/') continue;

    // Check if path exists as file or directory with index.html
    const rel = link.replace(/^\//, '');
    const directFile = path.resolve(rel);
    const indexFile = path.resolve(rel, 'index.html');

    if (!fs.existsSync(directFile) && !fs.existsSync(indexFile)) {
      brokenLinks.push({
        sourceFile: file,
        link,
        targetExpected: indexFile
      });
    }
  }
}

console.log(`Total internal links checked: ${totalLinksChecked}`);
console.log(`Total BROKEN links found: ${brokenLinks.length}`);

if (brokenLinks.length > 0) {
  console.log('\nSample broken links (first 20):');
  for (const b of brokenLinks.slice(0, 20)) {
    console.log(`  Source: ${b.sourceFile} -> Broken Link: ${b.link}`);
  }
}

fs.writeFileSync('data/broken-links-report.json', JSON.stringify(brokenLinks, null, 2));
console.log('Saved data/broken-links-report.json');
