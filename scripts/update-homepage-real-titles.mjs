import fs from 'node:fs';

console.log('=== UPDATING HOMEPAGE WITH REAL CREATIVE TITLES ===');

const catalog = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const itemMap = new Map();
for (const p of catalog) {
  if (p.id) itemMap.set(p.id, p);
}

let html = fs.readFileSync('index.html', 'utf8');

// Match <article class="product-card" data-id="([^"]+)">...<div class="product-image"><a href="([^"]+)" aria-label="([^"]+)"><img[^>]*alt="([^"]+)"[^>]*></a>...<h3><a class="product-link" href="([^"]+)">([^<]+)</a></h3><div class="product-type">([^<]+)</div>
const cardRegex = /<article class="product-card" data-id="(ucm-flow-gen-[^"]+)">[\s\S]*?<\/article>/g;

let count = 0;
const updatedHtml = html.replace(cardRegex, (fullCard, id) => {
  const p = itemMap.get(id);
  if (!p) return fullCard;

  count++;
  const realName = p.name;
  const realType = p.productType;
  const realPath = p.url.replace('https://www.urbanclothesmarket.com', '');

  return `<article class="product-card" data-id="${p.id}"><div class="product-image"><a href="${realPath}" aria-label="${realName}"><img loading="lazy" decoding="async" width="400" height="400" src="${p.image}" alt="${realName}"></a><button class="heart" data-save="${p.id}" aria-label="Save ${realName}" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button></div><div class="product-category">Unisex &amp; Everyone</div><h3><a class="product-link" href="${realPath}">${realName}</a></h3><div class="product-type">${realType}</div><div class="price">${p.price}<span>Pick size &amp; colors</span></div><div class="card-swatches" aria-hidden="true"><span class="swatch" style="background:#171717" title="Black"></span><span class="swatch" style="background:#f5f5f5;border:1px solid #d5d5d5" title="White"></span><span class="swatch" style="background:#9e9e9e" title="Heather Grey"></span><span class="swatch" style="background:#1b2a4a" title="Navy"></span><span class="swatch-more">+colors</span></div></article>`;
});

console.log(`Updated ${count} cards on homepage with real creative titles.`);
fs.writeFileSync('index.html', updatedHtml, 'utf8');
