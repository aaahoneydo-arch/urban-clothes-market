import fs from 'node:fs';
import path from 'node:path';
import { normalize, TYPES, THEMES } from '../src/catalog-core.mjs';
import { shell, card, themeTiles, filters, esc, icon, ORIGIN } from '../src/templates.mjs';

const root = path.resolve('dist-test');
fs.mkdirSync(root, { recursive: true });

// Load combined test catalog
const existing = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const all = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_all_products_catalog.json', 'utf8'));
const audit = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_live_audit_raw.json', 'utf8'));
const log = JSON.parse(fs.readFileSync('C:/Users/aaaho/.gemini/antigravity-ide/scratch/threadless_published_log.json', 'utf8'));

const pubAuditIds = new Set(audit.items.filter(i => i.published).map(i => String(i.threadless_id)));
const allPubIds = new Set([...pubAuditIds, ...log.published.map(p => String(p.threadless_id))]);

const existingIds = new Set();
for (const p of existing) {
  const url = new URL(p.url);
  const id = p.store === 'Spreadshop' ? url.searchParams.get('sellable') : p.id;
  existingIds.add(id);
}

const tees = all.filter(p => 
  p.id && 
  p.id.endsWith('-m-ts-cla') && 
  p.image_link && 
  !p.image_link.includes('mockup-preview') && 
  allPubIds.has(String(p.design_id))
);

const additions = [];
for (const t of tees) {
  const newId = 'threadless-' + t.design_id;
  if (existingIds.has(newId)) continue;
  existingIds.add(newId);

  const designName = t.title.replace(/\s*-\s*Men['’]s Classic T-Shirt$/i, '').trim();
  additions.push({
    id: newId,
    design: designName,
    productType: "Classic T-Shirt",
    name: `${designName} - Classic T-Shirt`,
    url: t.link,
    image: t.image_link,
    sourceImage: t.image_link,
    store: "Threadless",
    sourceDate: "2026-10-14"
  });
}

const combined = [...existing, ...additions];
const products = normalize(combined);
console.log('Building test hub with', products.length, 'normalized products...');

const meta = { count: products.length, updated: '2026-10-14', typeCounts: {}, themeCounts: {}, themeHero: {}, hero: products[0] };
const paths = new Set();
for (const p of products) {
  if (paths.has(p.path)) throw Error('Duplicate route ' + p.path);
  paths.add(p.path);
}

for (const [id] of TYPES) meta.typeCounts[id] = products.filter(p => id === 'kids' ? p.kids : p.category === id).length;
for (const [id] of THEMES) {
  const group = products.filter(p => id === 'all' || p.themes.includes(id));
  meta.themeCounts[id] = group.length;
  meta.themeHero[id] = group.find(p => p.category === 'tees' && !p.kids) || group[0];
}

const writes = new Set();
function write(file, data) {
  const full = path.resolve(root, file);
  if (!full.startsWith(root + path.sep)) throw Error('Unsafe destination');
  writes.add(full);
  if (fs.existsSync(full) && fs.readFileSync(full).equals(Buffer.from(data))) return;
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, data);
}

for (const file of ['style.css', 'app.js', 'search-worker.js']) write(file, fs.readFileSync('src/' + file));
for (const file of fs.readdirSync('public/product-images')) write('product-images/' + file, fs.readFileSync('public/product-images/' + file));
write('favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#171717"/><text x="32" y="41" text-anchor="middle" font-family="Arial" font-weight="900" font-size="23" fill="#d5fa42">UCM</text></svg>');

const designs = [...new Set(products.map(p => p.design))], productTypes = [...new Set(products.map(p => p.productType))];
write('catalog/index.json', JSON.stringify({ designs, productTypes, rows: products.map(p => [p.id, designs.indexOf(p.design), productTypes.indexOf(p.productType), p.price, p.category, p.audience, p.themes, p.kids, p.shard, p.brand, p.store]), updated: meta.updated }));
write('catalog/meta.json', JSON.stringify(meta));
for (let i = 0; i < products.length; i += 200) write('catalog/shards/' + Math.floor(i / 200) + '.json', JSON.stringify(products.slice(i, i + 200)));

const sitemap = [];
function page(url, title, description, body, extra = {}) {
  write((url === '/' ? '' : url.slice(1)) + 'index.html', shell({ title, description, path: url, body, meta, ...extra }));
  if (extra.robots !== 'noindex,follow') sitemap.push(url);
}

const section = (label, sub, items, link) => `<section class="section"><div class="section-head"><div><div class="sub">${esc(sub)}</div><h2>${esc(label)}</h2></div><a class="text-link" href="${link}">Explore more ${icon('arrow')}</a></div><div class="grid">${items.map(card).join('')}</div></section>`;
const hoodie = products.find(p => p.design === 'Moonlit Snake Floral Crescent' && p.productType === "Men's Premium Hoodie");

const home = `<div class="wrap"><section class="hero"><div class="hero-copy"><div class="eyebrow">A market for every kind of you</div><h1>YOUR WORLD.<br><span class="outline">YOUR STYLE.</span></h1><p>Big graphics. Real personality. Explore clothing, gifts, and everyday gear from across our shops—all in one place.</p><div class="hero-buttons"><a class="btn dark" href="/collections/all/">Explore the market ${icon('arrow')}</a><a class="btn" href="#collections">Find your vibe ${icon('arrow')}</a></div><div class="hero-note">DISCOVER HERE. CHOOSE YOUR OPTIONS AT THE SHOP.<br>Every BUY NOW! link takes you to the item’s selling page.</div></div><a class="hero-photography" href="${hoodie.path}" aria-label="Explore Moonlit Snake Floral Crescent hoodie"><img src="${esc(hoodie.image)}" alt="${esc(hoodie.name)}" width="600" height="600" fetchpriority="high"><span class="hero-photo-caption"><small>THE HOODIE EDIT</small><strong>Moonlit Snake Floral Crescent</strong><span>Find your favorite ${icon('arrow')}</span></span></a></section></div><div class="marquee"><span>CAT PEOPLE</span> · <span>GAMERS</span> · <span>GARAGE CREW</span> · <span>DOG LOVERS</span> · <span>EVERYDAY ORIGINALS</span></div><div class="wrap">${section('Fresh personalities.', 'FIND YOUR NEXT FAVORITE', products.filter(p => p.store === 'Threadless').slice(0, 5), '/collections/all/?store=Threadless#catalog')}<section class="section" id="collections"><div class="section-head"><div><div class="sub">GOOD COMPANY. GREAT GRAPHICS.</div><h2>Find your people.</h2><p>Shop the passions, personalities, and little obsessions that make you, you.</p></div></div>${themeTiles(meta)}</section>${section('A little attitude.', 'GRAPHICS WITH SOMETHING TO SAY', products.filter(p => p.store === 'Fourthwall').slice(0, 5), '/collections/all/?store=Fourthwall#catalog')}<section class="catalog-head" id="catalog"><div class="section-head"><div><div class="sub">CLOTHING, GIFTS &amp; EVERYDAY ORIGINALS</div><h2>Meet your next favorite.</h2></div></div>${filters(meta).replace('__CARDS__', products.slice(0, 24).map(card).join(''))}</section><section class="bottom-banner"><div><div class="eyebrow">One market. More to discover.</div><h2>MAKE IT YOURS.</h2></div><div><p>Find a favorite here. Choose sizes, colors, and delivery options on the product’s shop page. Each shop handles its own payment, fulfillment, and order support.</p><a class="btn dark" href="/shops/">Explore our shops ${icon('arrow')}</a></div></section></div>`;
page('/', 'Graphic Clothing, Gifts & Everyday Originals', 'Discover original graphic clothing, hoodies, gifts and everyday gear from across our shops.', home, { structured: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Urban Clothes Market', url: ORIGIN } });

function collection(id, label, kind, description, group) {
  const base = '/' + kind + '/' + id + '/', pages = Math.max(1, Math.ceil(group.length / 24));
  for (let n = 1; n <= pages; n++) {
    const url = n === 1 ? base : base + 'page/' + n + '/';
    page(url, label + (n > 1 ? ' — Page ' + n : ''), description, `<div class="wrap"><div class="breadcrumb"><a href="/">Home</a> / ${esc(label)}</div><section class="collection-intro"><div class="eyebrow">Find your own kind of original</div><h1>${esc(label)}</h1><p>${esc(description)}</p></section><section id="catalog">${filters(meta, { type: kind === 'types' ? id : '', theme: kind === 'collections' ? id : '' }).replace('__CARDS__', group.slice((n - 1) * 24, n * 24).map(card).join(''))}<noscript><nav class="pagination" aria-label="Catalog pages">${n > 1 ? `<a href="${n === 2 ? base : base + 'page/' + (n - 1) + '/'}">Previous</a>` : ''}<span>Page ${n} of ${pages}</span>${n < pages ? `<a href="${base}page/${n + 1}/">Next</a>` : ''}</nav></noscript></section></div>`);
  }
}

for (const [id, label, , description] of THEMES) collection(id, label, 'collections', description, products.filter(p => id === 'all' || p.themes.includes(id)));
for (const [id, label] of TYPES) collection(id, label, 'types', 'Explore ' + label.toLowerCase() + ' with original graphic designs. Select a favorite and continue to its shop to choose your options.', products.filter(p => id === 'kids' ? p.kids : p.category === id));

const relatedCache = new Map();
for (const p of products) {
  if (!relatedCache.has(p.category)) relatedCache.set(p.category, products.filter(x => x.category === p.category).filter((x, i, a) => a.findIndex(y => y.design === x.design) === i).slice(0, 6));
  const related = relatedCache.get(p.category).filter(x => x.id !== p.id).slice(0, 5);
  page(p.path, p.name, p.name + '. Explore the design and purchase directly from the selling shop.', `<div class="wrap"><div class="breadcrumb"><a href="/">Home</a> / <a href="/types/${p.category}/">${TYPES.find(t => t[0] === p.category)?.[1]}</a> / ${esc(p.design)}</div><section class="detail"><div class="detail-image"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="600" height="600" fetchpriority="high"></div><div class="detail-info"><div class="eyebrow">Wear your personality</div><h1>${esc(p.design)}</h1><h2>${esc(p.productType)}</h2><div class="detail-price">${p.price ? '$' + p.price.toFixed(2) : 'See current price'}</div>${p.price ? `<small>USD · catalog price recorded ${esc(p.sourceDate)}</small>` : ''}<p>${esc(p.productType)} featuring ${esc(p.design)}.</p><a class="btn dark buy-now" href="${esc(p.url)}">BUY NOW!</a><p>Continue to the selling shop to choose your options and complete your purchase. Final price, availability, shipping, and returns are confirmed there.</p><dl><dt>Product</dt><dd>${esc(p.productType)}</dd><dt>Options</dt><dd>Current sizes and colors are shown on the product’s shop page.</dd></dl><div class="detail-tags">${p.themes.map(id => `<a href="/collections/${id}/">${THEMES.find(t => t[0] === id)?.[1]}</a>`).join('')}</div></div></section>${section('More your style.', 'KEEP EXPLORING', related, '/types/' + p.category + '/')}</div>`, { structured: { '@context': 'https://schema.org', '@type': 'WebPage', name: p.name, url: ORIGIN + p.path, primaryImageOfPage: p.image.startsWith('/') ? ORIGIN + p.image : p.image } });
  if (p.legacyPath !== p.path) write(p.legacyPath.slice(1) + 'index.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=' + esc(p.path) + '"><link rel="canonical" href="' + ORIGIN + esc(p.path) + '"><title>Product moved | Urban Clothes Market</title></head><body><a href="' + esc(p.path) + '">View this product</a></body></html>');
}

const shopList = [
  ['Printify', 'https://urban-clothes-market.printify.me/', 'Graphic clothing, stickers, stationery, and home accessories. Browse current designs and options in the shop.'],
  ['Printful', 'https://urban-clothes-market.printful.me/', 'Graphic tees, mugs, and wall art. Explore current designs and product choices.'],
  ['Threadless', 'https://urbanclothesmarket.threadless.com/', 'Original graphic apparel and accessories. Browse the full artist shop for more designs and product options.'],
  ['Spreadshop', 'https://urbanclothesmarket.myspreadshop.com/', 'Tees, hoodies, hats, mugs, and everyday gear. Choose your design, size, and color in the shop.'],
  ['JasonTV Marketplace', 'https://jasontv-marketplace-shop.fourthwall.com/', 'Funny shirts, mugs, and bold everyday personality. Explore the full range in our Fourthwall shop.']
];

page('/shops/', 'Explore Our Shops', 'Find the full collections and purchase directly from our shops.', `<div class="wrap"><section class="collection-intro"><div class="eyebrow">All your favorites. One market.</div><h1>MORE TO DISCOVER.</h1><p>Our shops bring different designs and product options together. Explore the full collections here.</p></section><div class="shop-grid market-cta">${shopList.map(([name, url, desc]) => `<article class="shop-card"><h2>${esc(name)}</h2><p>${esc(desc)}</p><a class="btn dark" href="${url}">Explore shop ${icon('arrow')}</a></article>`).join('')}</div><p class="status-note">Every product’s BUY NOW! link opens its selling page. Choose options and complete checkout there. Orders from different shops are placed and handled separately.</p></div>`);

const legal = (title, body) => `<article class="legal wrap"><h1>${title}</h1>${body}</article>`;
const shopButton = `<a class="btn dark" href="/shops/">Find your shop ${icon('arrow')}</a>`;

page('/about/', 'About the Market', 'Original designs and everyday personality, together in one market.', legal('WELCOME TO YOUR MARKET.', `<p>Urban Clothes Market brings our shops together in one place. Explore original graphic clothing, accessories, and gifts for people with passions.</p><h2>Find your people.</h2><p>Browse by design, theme, or product type. Save favorites on this device and find the pieces that feel like you.</p><h2>From discovery to your door.</h2><p>Choose BUY NOW! to open the product’s selling shop. That shop handles options, payment, production, shipping, and support. There is no combined cart on this website.</p><h2>A collection that keeps growing.</h2><p>This site features ${products.length.toLocaleString()} catalog listings. It is a snapshot, so new designs, available options, and current prices may differ. Visit our shops for their full current collections.</p>${shopButton}`));
page('/privacy/', 'Privacy', 'How the market handles favorites, searches, and shop links.', legal('PRIVACY', `<p>This market does not require an account or collect payment, shipping, or order details. Favorites are saved in your browser on this device and can be removed by clearing this site’s data.</p><h2>Images and fonts</h2><p>Some product images are served by the shop’s image provider. Fonts may load from Google Fonts. These services and the site’s hosting provider receive ordinary web requests, including your IP address.</p><h2>Product links</h2><p>BUY NOW! opens the selling shop’s product page. That shop processes your order under its own terms and privacy policy.</p><h2>Search</h2><p>Catalog searches and filters run in your browser.</p>`));
page('/shipping/', 'Shipping & Delivery', 'Confirm delivery with the shop selling your item.', legal('SHIPPING & DELIVERY', `<p>Shipping costs and delivery estimates depend on the product, selling shop, and destination. Choose your options and review the total and estimated delivery before completing checkout in the shop.</p><h2>After ordering</h2><p>Use the confirmation email from the shop where you purchased the item for tracking and support. Items bought from different shops may arrive separately.</p>${shopButton}`));
page('/returns/', 'Returns & Exchanges', 'Find return information from the shop handling your order.', legal('RETURNS & EXCHANGES', `<p>The shop where you place your order sets the applicable return and exchange terms. Review those terms on the shop’s product or checkout page before purchasing.</p><h2>Need help with an order?</h2><p>Keep the confirmation email sent by the selling shop. Contact that shop through its order-help or support page, including the order number from that confirmation.</p>${shopButton}`));

for (const url of ['/cart/', '/checkout/', '/order-confirmation/', '/confirmation/']) page(url, 'Continue to your product’s shop', 'Purchases are completed through the shop selling the item.', legal('FIND IT. MAKE IT YOURS.', `<p>Choose a product and select BUY NOW! to choose options and complete your purchase in its shop.</p><a class="btn dark" href="/collections/all/">Explore the market ${icon('arrow')}</a>`), { robots: 'noindex,follow' });
page('/products/the-lawn-committee-has-concerns-heavyweight-pullover-hoodie-charcoal-black-heavyweight-pullover-hoodie-charcoal-black-41-hoodie-black/', 'Listing unavailable', 'Browse current hoodies and sweatshirts.', legal('THIS LISTING IS UNAVAILABLE.', `<p>This listing has been removed because its product details could not be confirmed.</p><a class="btn dark" href="/types/hoodies/">Explore hoodies ${icon('arrow')}</a>`), { robots: 'noindex,follow' });
write('404.html', shell({ title: 'Find your next favorite', description: 'Browse current designs at Urban Clothes Market.', path: '/404.html', meta, robots: 'noindex,follow', body: legal('THIS WAY TO THE MARKET.', `<p>This listing may have moved or is no longer available. Browse current products or explore the full shops.</p><a class="btn dark" href="/collections/all/">Browse products ${icon('arrow')}</a> <a class="btn" href="/shops/">Explore shops</a>`) }));
write('robots.txt', 'User-agent: *\nAllow: /\nDisallow: /catalog/\nSitemap: ' + ORIGIN + '/sitemap.xml\n');
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + sitemap.map(p => '<url><loc>' + ORIGIN + esc(p) + '</loc></url>').join('') + '</urlset>');
write('_headers', '/catalog/*\n  Cache-Control: public, max-age=0, must-revalidate\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');

console.log('Build complete! Total writes:', writes.size, 'Sitemap pages:', sitemap.length);
