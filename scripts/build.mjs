import fs from 'node:fs';
import path from 'node:path';
if(fs.existsSync('public') && !fs.existsSync('dist/mockups')) fs.cpSync('public','dist',{recursive:true});

import {productGallery} from '../src/lookbook.mjs';
import {normalize,TYPES,THEMES} from '../src/catalog-model.mjs';
import {shell,card,header,footer,themeTiles,filters,categoryChips,discoveryBar,showcaseRow,esc,icon,ORIGIN,SHOP} from '../src/templates.mjs';

const isHomeOnly = process.argv.includes('--home-only');
const root = path.resolve('dist');
fs.mkdirSync(root,{recursive:true});

const raw = JSON.parse(fs.readFileSync('data/catalog.json'));
const products = normalize(raw);
const sync = JSON.parse(fs.readFileSync('data/catalog-sync.json','utf8'));
const meta = {count:products.length,updated:sync.checkedDate,typeCounts:{},themeCounts:{},themeHero:{}};

for(const [id,,r] of TYPES) meta.typeCounts[id]=products.filter(p=>id==='kids'?p.kids:p.category===id).length;
for(const [id] of THEMES){
  const group=products.filter(p=>id==='all'||p.themes.includes(id));
  meta.themeCounts[id]=group.length;
  meta.themeHero[id]=group.find(p=>p.category==='tees'&&!p.kids)||group[0];
}
meta.hero=products.find(p=>/home is where the cat sits/i.test(p.design)&&/premium hoodie/i.test(p.productType)&&!p.kids)||products[0];

const photos = JSON.parse(fs.readFileSync('data/lifestyle.json','utf8'));
const generatedFiles = new Set();
const createdDirs = new Set();
function write(file,data){
  const target=path.join(root,file);
  generatedFiles.add(target);
  const dir = path.dirname(target);
  if (!createdDirs.has(dir)) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
    createdDirs.add(dir);
  }
  fs.writeFileSync(target,data);
}

for(const file of ['style.css','app.js','search-worker.js']) write(file,fs.readFileSync('src/'+file));
write('favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#171717"/><text x="32" y="41" text-anchor="middle" font-family="Arial" font-weight="900" font-size="23" fill="#d5fa42">UCM</text></svg>');

let designs=[...new Set(products.map(p=>p.design))], productTypes=[...new Set(products.map(p=>p.productType))];
const designMap = new Map(designs.map((d,i)=>[d,i]));
const productTypeMap = new Map(productTypes.map((t,i)=>[t,i]));
const rows = products.map(p=>[p.id,designMap.get(p.design),productTypeMap.get(p.productType),p.price,p.category,p.audience,p.themes,p.kids,p.shard,p.brand]);

write('catalog/index.json',JSON.stringify({designs,productTypes,rows,updated:meta.updated}));
write('catalog/meta.json',JSON.stringify(meta));
for(let start=0;start<products.length;start+=200) write('catalog/shards/'+Math.floor(start/200)+'.json',JSON.stringify(products.slice(start,start+200)));

const uniqueByDesign = arr => {
  const seen=new Set(), res=[];
  for(const p of arr){
    if(!seen.has(p.design)){
      seen.add(p.design);
      res.push(p);
    }
  }
  return res;
};

const isForce = process.argv.includes('--force');
const isCleanProfessional = p => Boolean(
  p.image &&
  !p.image.includes('transparent') &&
  !p.image.includes('master.png') &&
  !p.image.includes('127.0.0.1') &&
  !p.image.includes('localhost') &&
  (
    p.image.includes('/mockups/') ||
    p.image.includes('spreadshirtmedia.com/image-server')
  )
);

// Row showcase generators with memoization to avoid quadratic scans across full catalog
const typeShowcaseCache = new Map();
const typeShowcase = (id, title, subtitle) => {
  const cacheKey = `${id}|${title}|${subtitle}`;
  if (typeShowcaseCache.has(cacheKey)) return typeShowcaseCache.get(cacheKey);
  const matching = products.filter(p => id === 'kids' ? p.kids : p.category === id);
  const clean = matching.filter(isCleanProfessional).sort(() => Math.random() - 0.5);
  const other = matching.filter(p => !isCleanProfessional(p)).sort(() => Math.random() - 0.5);
  const uniqueItems = uniqueByDesign([...clean, ...other]);
  const count = matching.length;
  const res = showcaseRow({
    id,
    title,
    subtitle,
    count,
    link: `/types/${id}/`,
    isType: true,
    products: uniqueItems.slice(0, 10)
  });
  typeShowcaseCache.set(cacheKey, res);
  return res;
};

const themeShowcaseCache = new Map();
const themeShowcase = (id, title, subtitle) => {
  const cacheKey = `${id}|${title}|${subtitle}`;
  if (themeShowcaseCache.has(cacheKey)) return themeShowcaseCache.get(cacheKey);
  const matching = products.filter(p => id === 'all' || p.themes.includes(id));
  const clean = matching.filter(isCleanProfessional).sort(() => Math.random() - 0.5);
  const other = matching.filter(p => !isCleanProfessional(p)).sort(() => Math.random() - 0.5);
  const uniqueItems = uniqueByDesign([...clean, ...other]);
  const count = matching.length;
  const res = showcaseRow({
    id,
    title,
    subtitle,
    count,
    link: `/collections/${id}/`,
    isType: false,
    products: uniqueItems.slice(0, 10)
  });
  themeShowcaseCache.set(cacheKey, res);
  return res;
};

const homeBody = `
<div class="wrap">
  <!-- INTERACTIVE CATALOG BROWSER & DEEP FILTERS (AT VERY TOP - WALMART SEARCH RESULTS STYLE) -->
  <section class="catalog-head" id="catalog" style="margin-top: 10px;">
    <div class="section-head">
      <div>
        <div class="sub">INSTANT INVENTORY EXPLORER · ALL ${products.length.toLocaleString()}+ ITEMS</div>
        <h2>Explore &amp; Discover Entire Archive</h2>
        <p>Filter by item variation, size, passion theme, budget, or brand. Click shuffle for a fresh discovery mix anytime.</p>
      </div>
      <div class="row-actions">
        <button class="shuffle" data-shuffle type="button">${icon('shuffle')} Shuffle All</button>
        <a class="text-link" href="/collections/all/">Browse Full Archive ↗</a>
      </div>
    </div>
    ${filters(meta).replace('__CARDS__', uniqueByDesign(products.filter(p=>p.category==='hoodies').filter(isCleanProfessional).sort(()=>Math.random()-0.5)).slice(0, 24).map(card).join(''))}
  </section>

  <!-- MID-PAGE SEARCH & DISCOVERY BAR #1 -->
  ${discoveryBar({
    id: 'discovery-mid1',
    title: 'Looking for a Specific Graphic or Theme?',
    subtitle: 'Search across all ' + products.length.toLocaleString() + '+ items or hit surprise me for an instant random discovery mix.',
    placeholder: 'Search ' + products.length.toLocaleString() + '+ items (cats, cars, gaming, dogs, sarcastic, retro...)'
  })}

  <!-- ALL 15 ITEM VARIATION SECTIONS (SCROLLABLE TRACKS WITH LIVE SHUFFLE) -->
  ${typeShowcase('hoodies', 'Hoodies & Premium Sweatshirts', 'Cozy fleece pullovers, contrast hoodies, and heavyweight zip sweatshirts built for cold weather.')}
  ${typeShowcase('jackets', 'Jackets, Windbreakers & Outerwear', 'Weather-resistant lightweight jackets, track jackets, and zip streetwear layers.')}
  ${typeShowcase('tees', 'Tees, Tanks & Graphic Shirts', 'Classic heavyweight tees, slim-fit premium shirts, and athletic tanks.')}
  ${typeShowcase('hats', 'Hats, Caps & Beanies', 'Snapbacks, vintage baseball caps, trucker hats, and knit beanies.')}
  ${typeShowcase('mugs', 'Mugs, Tumblers & Drinkware', 'Ceramic coffee mugs, insulated travel tumblers, and beverage gear.')}
  ${typeShowcase('bags', 'Bags, Backpacks & Totes', 'Canvas totes, gym duffels, drawstring bags, and travel pouches.')}
  ${typeShowcase('stickers', 'Stickers, Decals & Buttons', 'Durable vinyl die-cut stickers for laptops, water bottles, and cars.')}
  ${typeShowcase('tech', 'Phone Cases, Laptop Sleeves & Desk Mats', 'Shockproof phone cases, padded laptop sleeves, and smooth gaming desk pads.')}
  ${typeShowcase('art', 'Posters, Prints & Wall Art', 'High-resolution archival paper posters, canvas wraps, and graphic art prints.')}
  ${typeShowcase('home', 'Home Decor, Pillows & Fleece Blankets', 'Decorative throw pillows, cozy fleece blankets, kitchen aprons, and wall clocks.')}
  ${typeShowcase('stationery', 'Stationery, Spiral Notebooks & Journals', 'Hardcover journals, ruled spiral notebooks, and greeting stationery.')}
  ${typeShowcase('kids', 'Kids, Toddler & Baby Gear', 'Youth tees, toddler apparel, and organic baby bodysuits.')}
  ${typeShowcase('bottoms', 'Shorts, Joggers & Activewear', 'Comfortable cotton joggers, athletic shorts, and loungewear.')}
  ${typeShowcase('pets', 'Pet Gear & Dog Bandanas', 'Graphic pet bandanas and accessories for your four-legged best friends.')}
  ${typeShowcase('accessories', 'Accessories & Keychains', 'Embroidered jet tags, novelty keychains, and everyday add-ons.')}

  <!-- MID-PAGE SEARCH BAR #2 (Transition to Curated Themes) -->
  ${discoveryBar({
    id: 'discovery-mid2',
    title: 'Gifts & Apparel by Passion Theme',
    subtitle: 'Brighten your desk, garage, wardrobe, or phone with durable graphic prints made for daily life.',
    placeholder: 'Search themes, hobbies, sports, animals, humor...'
  })}

  <!-- PASSION THEMES HEADER -->
  <section class="section" id="collections">
    <div class="section-head">
      <div>
        <div class="sub">CURATED OBSESSIONS · DESIGN PASSIONS</div>
        <h2>Shop by Passion Theme</h2>
        <p>Explore graphics curated around what you live and breathe every single day.</p>
      </div>
      <a class="text-link" href="/collections/all/">All Collections ↗</a>
    </div>
    ${themeTiles(meta)}
  </section>

  <!-- PASSION THEMES SCROLLABLE ROWS -->
  ${themeShowcase('love', 'Love & Romance Collection', 'Heartfelt gifts, soulmates, and loving couple designs.')}
  ${themeShowcase('gothic', 'Gothic & Dark Aesthetic', 'Skulls, dark fantasy, occult mystery, and alternative streetwear.')}
  ${themeShowcase('sports', 'Sports & Fitness Collection', 'Active workout gear, athletic pride, and sports passion.')}
  ${themeShowcase('relationships', 'Relationships & Family Edit', 'Apparel and gifts celebrating family, couples, and lifelong bonds.')}
  ${themeShowcase('inspirational', 'Inspirational & Daily Mindset', 'Positive energy, motivational quotes, and uplifting reminders.')}
  ${themeShowcase('gamers', 'Gamers & Retro Arcade', 'For your next game night, boss fight, or victory lap.')}
  ${themeShowcase('cats', 'Cat Lovers Edit', 'For the ones who know who really runs the house.')}
  ${themeShowcase('dogs', 'Dog Lovers Edit', 'Wear a little love for your four-legged best friend.')}
  ${themeShowcase('cars', 'Car Enthusiasts & Garage Crew', 'For the garage crowd and the open-road dreamers.')}
  ${themeShowcase('humor', 'Funny & Sarcastic', 'Good jokes, deadpan humor, and great conversation starters.')}
  ${themeShowcase('diy', 'DIY, Makers & Handymen', 'Made for people who would rather build it themselves.')}

  <!-- BOTTOM SEARCH & DISCOVERY BANNER -->
  ${discoveryBar({
    id: 'discovery-bottom',
    title: 'Ready to Find Your Next Favorite?',
    subtitle: 'Search across 100,000+ items or hit surprise me to discover something unexpected.',
    placeholder: 'Search 100,000+ items or enter a theme...'
  })}
</div>
`;

// Write index.html
write('index.html', shell({
  title: 'Graphic Clothing, Gifts & Massive Inventory Showcase',
  description: `Shop ${products.length.toLocaleString()}+ graphic tees, hoodies, mugs, stickers, and gifts across 15 departments for cat lovers, dog lovers, gamers, cars and more at Urban Clothes Market.`,
  body: homeBody,
  meta,
  structured: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Urban Clothes Market',
    url: ORIGIN
  }
}));

const fallbackScript = `<script id="dynamic-product-fallback">
(function() {
  const pth = window.location.pathname;
  if (!pth.startsWith('/products/')) return;
  const slug = pth.replace(/^\\/products\\//, '').replace(/\\/$/, '').trim();
  if (!slug) return;
  const main = document.querySelector('main');
  if (main) {
    main.innerHTML = '<div class="wrap" style="padding:80px 20px;text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--text,#111)">⚡ Connecting to Urban Clothes Market Catalog...</div><p style="color:#666;margin-top:8px">Loading authentic item details...</p></div>';
  }
  fetch('/catalog/index.json').then(r => r.json()).then(idx => {
    const slugLower = slug.toLowerCase();
    let foundRow = null;
    for (let i = 0; i < idx.rows.length; i++) {
      const r = idx.rows[i];
      if (r[0] === slug || r[0].toLowerCase() === slugLower) {
        foundRow = r;
        break;
      }
    }
    if (!foundRow) {
      for (let i = 0; i < idx.rows.length; i++) {
        const r = idx.rows[i];
        if (slugLower.includes(r[0].toLowerCase()) || r[0].toLowerCase().includes(slugLower)) {
          foundRow = r;
          break;
        }
      }
    }
    if (!foundRow) return;
    const shardId = foundRow[8];
    return fetch('/catalog/shards/' + shardId + '.json').then(r => r.json()).then(items => {
      const p = items.find(x => x.id === foundRow[0] || (x.path && x.path.includes(slug)));
      if (!p) return;
      document.title = (p.design || p.name) + ' | Urban Clothes Market';
      const buyUrl = p.url || ('https://urbanclothesmarket.myspreadshop.com/' + encodeURIComponent(p.design || ''));
      const price = Number(p.price || 24.99).toFixed(2);
      if (main) {
        main.innerHTML = \`
          <div class="wrap pdp-wrap">
            <nav class="breadcrumb pdp-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span class="crumb-sep">/</span>
              <a href="/types/\${p.category || 'tees'}/">\${(p.category || 'Apparel').toUpperCase()}</a>
              <span class="crumb-sep">/</span>
              <span class="current-crumb">\${p.design}</span>
            </nav>
            <section class="detail pdp-showcase">
              <div class="pdp-gallery-col">
                <div class="pdp-main-image-wrap">
                  <img class="pdp-main-image" src="\${p.image}" alt="\${p.name || p.design}" width="600" height="600" loading="eager" decoding="async">
                  <div class="pdp-image-badge">⚡ OFFICIAL STORE VERIFIED</div>
                </div>
              </div>
              <div class="detail-info pdp-action-col">
                <div class="pdp-top-badge-row">
                  <span class="pdp-category-pill">\${(p.category || 'Apparel').toUpperCase()}</span>
                  <span class="pdp-stock-pill">✓ Made to Order · In Stock</span>
                </div>
                <h1 class="pdp-title">\${p.design}</h1>
                <div class="pdp-subtitle">\${p.productType || 'Original Graphic Wear'}</div>
                <div class="pdp-price-box">
                  <div class="pdp-price-amount">$\${price}</div>
                  <div class="pdp-shipping-note">Free shipping on orders $75+ · Dispatched in 2-3 business days</div>
                </div>
                <div class="pdp-cta-container">
                  <a class="btn-pdp-buy" href="\${buyUrl}" target="_blank" rel="noopener">
                    <span>Buy Now on Official Store — $\${price}</span>
                    <span class="cta-arrow">↗</span>
                  </a>
                  <div class="pdp-cta-subtext">
                    <span>🔒 Direct to Official Shop</span>
                    <span>⚡ Select Size &amp; Color at Checkout</span>
                    <span>↩️ 30-Day Guarantee</span>
                  </div>
                </div>
                <div class="pdp-quick-options">
                  <div class="pdp-opt-row">
                    <span class="pdp-opt-label">Available Sizes:</span>
                    <div class="pdp-size-badges">
                      \${(p.sizes && p.sizes.length ? p.sizes : ['S','M','L','XL','2XL','3XL']).map(s => \`<span class="opt-badge">\${s}</span>\`).join('')}
                    </div>
                  </div>
                  <div class="pdp-opt-row">
                    <span class="pdp-opt-label">Available Colors:</span>
                    <div class="pdp-color-badges">
                      \${(p.colors && p.colors.length ? p.colors : ['Black','White']).map(c => \`<span class="opt-badge">\${c}</span>\`).join('')}
                    </div>
                  </div>
                </div>
                <div class="pdp-mini-trust">
                  <span class="trust-badge-pill">🛡️ Guaranteed Secure Checkout</span>
                  <span class="trust-badge-pill">📦 Tracked Door-to-Door</span>
                  <span class="trust-badge-pill">★ Google Reviews Partner</span>
                </div>
              </div>
            </section>
            <section class="pdp-bottom-details">
              <div class="pdp-details-grid">
                <div class="pdp-detail-card">
                  <h3>About This Graphic Design</h3>
                  <p>\${p.description || 'Premium original graphic merchandise crafted with high-density print technology. Tailored for comfort, durability, and bold personal expression.'}</p>
                </div>
                <div class="pdp-detail-card">
                  <h3>Product Specifications</h3>
                  <p>Eco-friendly high-density print on pre-shrunk premium materials. Double-stitched seams with retail streetwear finish.</p>
                </div>
                <div class="pdp-detail-card">
                  <h3>Satisfaction &amp; Returns</h3>
                  <p>Custom printed with vibrant archival clarity. If you are not 100% satisfied with your order, we will replace it or issue a full refund within 30 days.</p>
                  <a class="pdp-policy-link" href="/returns/">Read Full Return Policy ↗</a>
                </div>
              </div>
            </section>
          </div>
        \`;
      }
    });
  }).catch(err => {
    console.warn('Could not dynamically load product:', err);
  });
})();
</script>`;
write('404.html',shell({title:'Page not found',description:'Find your next favorite at Urban Clothes Market.',path:'/404.html',meta,robots:'noindex,follow',body:'<div class="legal wrap"><h1>THIS WAY TO THE MARKET.</h1><p>That page could not be found.</p><a class="btn dark" href="/">Back to the market ↗</a></div>' + fallbackScript}));
write('_headers','/catalog/*\n  Cache-Control: public, max-age=3600\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');

// Copy index.html, 404.html, style.css, app.js directly from source to dist and root
fs.copyFileSync(path.join(root,'index.html'), 'index.html');
fs.copyFileSync(path.join(root,'404.html'), '404.html');
fs.copyFileSync(path.join(root,'_headers'), '_headers');
fs.copyFileSync('src/style.css', path.join(root,'style.css'));
fs.copyFileSync('src/style.css', 'style.css');
fs.copyFileSync('src/app.js', path.join(root,'app.js'));
fs.copyFileSync('src/app.js', 'app.js');
fs.copyFileSync('src/search-worker.js', path.join(root,'search-worker.js'));
fs.copyFileSync('src/search-worker.js', 'search-worker.js');
fs.cpSync(path.join(root,'catalog'), 'catalog', { recursive: true });

if(isHomeOnly){
  console.log('Homepage, 404, styles, and scripts compiled and synced to root successfully!');
  process.exit(0);
}

// Full build continued:
let sitemap=['/','/about/'];

const TYPE_SEO = {
  tees: {
    title: 'Graphic Tees, Modern Streetwear Shirts & Bargain Tops | Urban Clothes Market',
    h1: 'Graphic Tees, Modern Streetwear Shirts &amp; Bargain Tops',
    eyebrow: 'ORIGINAL GRAPHIC APPAREL UNDER $25',
    description: 'Shop original graphic tees, oversized streetwear shirts, vintage heavyweight t-shirts, and cheap bargain graphic tops under $25 at Urban Clothes Market.',
    leadText: 'Explore over 18,000+ original graphic tees, athletic tanks, heavyweight cotton shirts, and modern streetwear tops. Wear your personality with durable screen-quality prints made for everyday style.',
    breadcrumb: 'Graphic Tees &amp; Tops'
  },
  hoodies: {
    title: 'Cheap Graphic Hoodies, Heavyweight Pullovers & Urban Sweatshirts | Urban Clothes Market',
    h1: 'Graphic Hoodies, Heavyweight Pullovers &amp; Urban Sweatshirts',
    eyebrow: 'HEAVYWEIGHT FLEECE &amp; COZY STREETWEAR',
    description: 'Explore heavyweight graphic hoodies, cozy fleece pullovers, zip sweatshirts, and cheap urban streetwear hoodies at Urban Clothes Market. High-density prints built for everyday comfort.',
    leadText: 'Cozy up in over 8,600+ graphic hoodies and sweatshirts. From heavyweight fleece pullovers by Gildan and Champion to organic zip hoodies, find your signature streetwear layer.',
    breadcrumb: 'Hoodies &amp; Sweatshirts'
  },
  hats: {
    title: 'Streetwear Hats, Vintage Snapbacks & Embroidered Beanies | Urban Clothes Market',
    h1: 'Streetwear Hats, Vintage Snapbacks &amp; Beanies',
    eyebrow: 'AUTHENTIC HEADWEAR &amp; RETRO CAPS',
    description: 'Shop flat-brim snapbacks, vintage baseball caps, embroidered dad hats, trucker hats, and knit beanies at Urban Clothes Market. Bold graphic street style for every fit.',
    leadText: 'Top off your look with 6,200+ original headwear styles. Discover premium Flexfit baseball caps, breathable trucker hats, washed rope caps, and soft knit beanies.',
    breadcrumb: 'Hats &amp; Beanies'
  },
  mugs: {
    title: 'Novelty Graphic Coffee Mugs & Ceramic Drinkware | Urban Clothes Market',
    h1: 'Graphic Coffee Mugs, Travel Tumblers &amp; Novelty Drinkware',
    eyebrow: 'CERAMIC MUGS, TUMBLERS &amp; BOTTLES',
    description: 'Discover funny novelty coffee mugs, ceramic graphic mugs, insulated travel tumblers, and water bottles at Urban Clothes Market. Perfect affordable gifts with personality.',
    leadText: 'Brighten your morning coffee routine with over 6,000+ graphic mugs, 40 oz travel tumblers, camper mugs, and insulated stainless bottles featuring unique original artwork.',
    breadcrumb: 'Mugs &amp; Drinkware'
  },
  jackets: {
    title: 'Streetwear Jackets, Windbreakers & Urban Outerwear | Urban Clothes Market',
    h1: 'Streetwear Jackets, Windbreakers &amp; Urban Outerwear',
    eyebrow: 'LIGHTWEIGHT LAYERS &amp; WINDBREAKERS',
    description: 'Shop weather-resistant lightweight jackets, track windbreakers, and urban outerwear layers at Urban Clothes Market. Modern street aesthetic built for all seasons.',
    leadText: 'Stay warm and elevate your street fit with lightweight windbreakers, command zip layers, and weather-ready graphic jackets designed for daily city energy.',
    breadcrumb: 'Jackets &amp; Outerwear'
  },
  bottoms: {
    title: 'Urban Joggers, Athletic Shorts & Streetwear Pants | Urban Clothes Market',
    h1: 'Urban Joggers, Athletic Shorts &amp; Streetwear Bottoms',
    eyebrow: 'ALL-DAY COMFORT &amp; ACTIVE STREETWEAR',
    description: 'Discover comfortable cotton joggers, athletic shorts, and lounge bottoms at Urban Clothes Market. Relaxed fits and street-ready comfort at direct-to-consumer prices.',
    leadText: 'Level up your daily rotation with relaxed cotton fleece joggers and athletic training shorts engineered for casual streetwear mobility.',
    breadcrumb: 'Shorts &amp; Joggers'
  },
  stickers: {
    title: 'Vinyl Die-Cut Stickers, Decals & Graphic Badges | Urban Clothes Market',
    h1: 'Vinyl Die-Cut Stickers, Laptop Decals &amp; Buttons',
    eyebrow: 'WEATHERPROOF VINYL DECALS UNDER $5',
    description: 'Shop durable vinyl die-cut stickers, laptop decals, water bottle stickers, and bumper decals at Urban Clothes Market. High-gloss, UV-resistant original graphics.',
    leadText: 'Over 3,700+ waterproof vinyl decals and pin badges. Perfect for personalizing laptops, hydro flasks, skate decks, and toolboxes with vibrant scratch-resistant art.',
    breadcrumb: 'Stickers &amp; Decals'
  },
  bags: {
    title: 'Canvas Tote Bags, Backpacks & Travel Pouches | Urban Clothes Market',
    h1: 'Canvas Tote Bags, Backpacks &amp; Travel Gear',
    eyebrow: 'EVERYDAY CARRY &amp; REUSABLE CANVAS TOTES',
    description: 'Shop durable cotton canvas tote bags, gym backpacks, and travel pouches at Urban Clothes Market. Eco-friendly everyday carry featuring original graphic art.',
    leadText: 'Carry your essentials in style with 4,200+ heavy-duty cotton canvas totes, gym duffels, and graphic backpacks built for school, groceries, and weekend trips.',
    breadcrumb: 'Bags &amp; Totes'
  },
  art: {
    title: 'Graphic Posters, Wall Art Prints & Canvas Decor | Urban Clothes Market',
    h1: 'Graphic Posters, Gallery Wall Art &amp; Prints',
    eyebrow: 'ARCHIVAL PRINTS &amp; MODERN WALL DECOR',
    description: 'Discover archival paper posters, stretched canvas gallery wraps, and modern graphic wall art prints at Urban Clothes Market. Vibrant visual decor for homes and studios.',
    leadText: 'Transform your space with gallery-quality art prints and high-resolution posters celebrating gaming, cars, animals, synthwave, and urban culture.',
    breadcrumb: 'Posters &amp; Wall Art'
  },
  pets: {
    title: 'Pet Bandanas, Dog Gear & Animal Lover Accessories | Urban Clothes Market',
    h1: 'Pet Bandanas, Dog Gear &amp; Animal Accessories',
    eyebrow: 'ORIGINAL GEAR FOR FOUR-LEGGED FRIENDS',
    description: 'Shop soft cotton pet bandanas, dog accessories, and animal lover gear at Urban Clothes Market. Keep your four-legged best friend looking fresh on every walk.',
    leadText: 'Treat your pup to soft cotton graphic bandanas and durable pet accessories designed to match your favorite streetwear fits.',
    breadcrumb: 'Pet Gear'
  },
  kids: {
    title: 'Kids Graphic Tees, Toddler Hoodies & Baby Bodysuits | Urban Clothes Market',
    h1: 'Kids Graphic Apparel, Toddler Hoodies &amp; Baby Bodysuits',
    eyebrow: 'SMALL SIZES WITH BIG PERSONALITY',
    description: 'Shop funny kids graphic tees, cozy toddler hoodies, and organic cotton baby bodysuits at Urban Clothes Market. Made soft and durable for little adventurers.',
    leadText: 'Over 7,500+ colorful graphic pieces made specifically for toddlers, kids, and babies. Soft, ring-spun cotton that withstands the playground and repeated wash cycles.',
    breadcrumb: 'Kids &amp; Baby'
  },
  home: {
    title: 'Graphic Throw Pillows, Blankets & Home Accents | Urban Clothes Market',
    h1: 'Graphic Home Decor, Throw Pillows &amp; Blankets',
    eyebrow: 'COZY LIVING WITH DISTINCT PERSONALITY',
    description: 'Discover decorative throw pillows, plush fleece blankets, kitchen aprons, and desk mats at Urban Clothes Market. Elevate your room with original art.',
    leadText: 'Infuse your home or workspace with original personality across 29,000+ throw pillows, cozy blankets, mousepads, holiday ornaments, and kitchen accessories.',
    breadcrumb: 'Home &amp; Gifts'
  },
  accessories: {
    title: 'Streetwear Accessories, Keychains & Novelty Items | Urban Clothes Market',
    h1: 'Streetwear Accessories, Keychains &amp; Jet Tags',
    eyebrow: 'EVERYDAY ACCENTS &amp; SMALL FINDS',
    description: 'Shop embroidered keychains, jet tags, novelty accessories, and everyday accents at Urban Clothes Market. Small pieces that make a big statement.',
    leadText: 'Complete your daily carry with high-detail embroidered jet tags, graphic keychains, and novelty lifestyle accents.',
    breadcrumb: 'Accessories'
  },
  tech: {
    title: 'Phone Cases, Laptop Sleeves & Desk Mats | Urban Clothes Market',
    h1: 'Phone Cases, Laptop Sleeves &amp; Gaming Desk Mats',
    eyebrow: 'SLIM SNAP CASES, SLEEVES &amp; DESK PADS',
    description: 'Shop protective iPhone cases, Samsung phone cases, padded laptop sleeves, and oversized gaming desk mats at Urban Clothes Market. High-definition graphic tech gear.',
    leadText: 'Protect your everyday devices and outfit your battle station with impact-resistant phone cases, 13-15 inch padded laptop sleeves, and ultra-smooth extended gaming desk pads.',
    breadcrumb: 'Phone Cases &amp; Tech'
  },
  stationery: {
    title: 'Spiral Notebooks, Journals & Creative Stationery | Urban Clothes Market',
    h1: 'Spiral Notebooks, Hardcover Journals &amp; Stationery',
    eyebrow: 'RULED NOTEBOOKS &amp; CREATOR JOURNALS',
    description: 'Discover 120-page spiral notebooks, hardcover journals, and creative stationery at Urban Clothes Market. Featuring original graphic covers for notes, sketches, and journaling.',
    leadText: 'Put pen to paper with original graphic notebooks and journals. Durable spiral bindings, 90gsm ruled pages, and vibrant high-definition cover prints.',
    breadcrumb: 'Stationery &amp; Journals'
  }
};

function collection(id,label,kind,description,group){
  const base='/'+kind+'/'+id+'/';
  const sortedGroup = [...group].sort((a,b)=>(isCleanProfessional(b)?1:0)-(isCleanProfessional(a)?1:0));
  const pageSize=24,pages=Math.max(1,Math.ceil(sortedGroup.length/pageSize));
  const seo = (kind==='types' && TYPE_SEO[id]) ? TYPE_SEO[id] : null;
  const pageTitle = seo ? seo.title : label;
  const pageDesc = seo ? seo.description : description;
  const pageH1 = seo ? seo.h1 : esc(label);
  const pageEyebrow = seo ? seo.eyebrow : 'Find your own kind of original';
  const pageLead = seo ? seo.leadText : esc(description);
  const pageCrumb = seo ? seo.breadcrumb : esc(label);

  for(let page=1;page<=pages;page++){
    const pagePath=page===1?base:base+'page/'+page+'/';
    const targetFile = path.join(root, pagePath.slice(1) + 'index.html');
    if (!isForce && fs.existsSync(targetFile)) {
      sitemap.push(pagePath);
      generatedFiles.add(targetFile);
      continue;
    }
    const selected=sortedGroup.slice((page-1)*pageSize,page*pageSize);
    const intro=`<div class="wrap"><div class="breadcrumb"><a href="/">Home</a> / <a href="/#catalog">${kind==='types'?'Product Variations':'Collections'}</a> / ${pageCrumb}</div><section class="collection-intro"><div class="eyebrow">${pageEyebrow}</div><h1>${pageH1}</h1><p>${pageLead}</p></section><section id="catalog">${filters(meta,{type:kind==='types'?id:'',theme:kind==='collections'?id:''}).replace('__CARDS__',selected.map(card).join(''))}<nav aria-label="Collection pages" class="pagination">${page>1?`<a class="btn" href="${page===2?base:base+'page/'+(page-1)+'/'}">← Page ${page-1}</a>`:''}<span>Catalog page ${page} of ${pages}</span>${page<pages?`<a class="btn" href="${base}page/${page+1}/">Page ${page+1} →</a>`:''}</nav></section><section class="section"><h2 style="font:700 35px var(--display)">Explore another variation</h2>${themeTiles(meta)}</section></div>`;
    
    const structuredGraph = [
      {
        '@type': 'CollectionPage',
        name: pageTitle + (page>1 ? ' — Page '+page : ''),
        description: pageDesc,
        url: ORIGIN + pagePath,
        isPartOf: { '@type': 'WebSite', name: 'Urban Clothes Market', url: ORIGIN }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN },
          { '@type': 'ListItem', position: 2, name: kind==='types'?'Product Types':'Collections', item: ORIGIN + '/#catalog' },
          { '@type': 'ListItem', position: 3, name: seo ? seo.breadcrumb.replace(/&amp;/g, '&') : label, item: ORIGIN + base }
        ]
      }
    ];

    write(pagePath.slice(1)+'index.html',shell({title:pageTitle+(page>1?' — Page '+page:''),description:pageDesc,path:pagePath,body:intro,meta,structured:{'@context':'https://schema.org','@graph':structuredGraph}}));
    sitemap.push(pagePath);
  }
}

for(const [id,label,,description] of THEMES) collection(id,label,'collections',description,products.filter(p=>id==='all'||p.themes.includes(id)));
for(const [id,label] of TYPES) collection(id,label,'types','Explore '+label.toLowerCase()+' featuring original graphic designs. Combine a theme with an item variation to find your perfect match.',products.filter(p=>id==='kids'?p.kids:p.category===id));

function getProductDetails(p) {
  const cat = p.category;
  if (cat === 'art') {
    return {
      eyebrow: 'Gallery Quality Wall Art',
      desc: `Museum-grade ${esc(p.productType.toLowerCase())} featuring the “${esc(p.design)}” artwork. Printed with fade-resistant archival pigment inks for exceptional color depth and fine detail. Ready to hang and elevate any living space, studio, or office.`,
      specLabel: 'Art Quality & Materials',
      specValue: 'Heavyweight cotton-poly blend archival canvas • Solid wood backing • Vivid UV fade-resistant inks'
    };
  } else if (cat === 'mugs') {
    return {
      eyebrow: 'Signature Ceramic Drinkware',
      desc: `Premium made-to-order ${esc(p.productType.toLowerCase())} featuring the “${esc(p.design)}” graphic. Durable ceramic construction designed for daily coffee, tea, and beverages with vivid double-sided permanent print.`,
      specLabel: 'Drinkware Specs',
      specValue: '100% High-grade ceramic • Lead and BPA free • Microwave and dishwasher safe'
    };
  } else if (cat === 'tech') {
    return {
      eyebrow: 'Impact Tech Protection',
      desc: `Precision-engineered ${esc(p.productType.toLowerCase())} featuring the “${esc(p.design)}” graphic. Dual-layer impact absorption protects your device against drops and scratches while keeping a sleek, modern profile.`,
      specLabel: 'Tech Specs',
      specValue: 'Shock-absorbing TPU liner • Scratch-resistant polycarbonate shell • Wireless charging compatible'
    };
  } else if (cat === 'home') {
    return {
      eyebrow: 'Curated Artisan Home Decor',
      desc: `Artisan ${esc(p.productType.toLowerCase())} featuring the “${esc(p.design)}” graphic. Designed to bring personality, cozy comfort, and vibrant aesthetic into your home decor.`,
      specLabel: 'Home Decor Specs',
      specValue: 'Ultra-plush hypoallergenic microfiber • Full edge-to-edge sublimation print • Machine washable'
    };
  } else if (cat === 'stickers') {
    return {
      eyebrow: 'All-Weather Vinyl Art',
      desc: `Heavy-duty ${esc(p.productType.toLowerCase())} featuring the “${esc(p.design)}” graphic. Waterproof, weather-resistant, and scratch-resistant for laptops, water bottles, skateboards, and cars.`,
      specLabel: 'Vinyl Specs',
      specValue: 'Premium all-weather vinyl • UV protective laminate • Clean peel with zero sticky residue'
    };
  } else if (cat === 'stationery') {
    return {
      eyebrow: 'Fine Stationery & Office',
      desc: `High-quality ${esc(p.productType.toLowerCase())} featuring the “${esc(p.design)}” graphic. Smooth writing surface with durable binding for journaling, planning, sketching, and notes.`,
      specLabel: 'Stationery Specs',
      specValue: '120 ruled archival pages • 90gsm acid-free paper • Sturdy protective cover'
    };
  } else {
    return {
      eyebrow: 'Wear Your Personality',
      desc: `A premium ${esc(p.productType.toLowerCase())} featuring the “${esc(p.design)}” graphic. Soft, breathable, and pre-shrunk for comfortable all-day streetwear fit.`,
      specLabel: 'Fabric & Garment Specs',
      specValue: 'Pre-shrunk combed ring-spun cotton blend • Double-needle stitched hem & sleeves • Retail unisex fit'
    };
  }
}

function getColorHex(c) {
  const s = String(c || '').toLowerCase().trim();
  if (s.includes('black')) return '#171717';
  if (s.includes('charcoal')) return '#333333';
  if (s.includes('white')) return '#f8f8f8';
  if (s.includes('grey') || s.includes('gray')) return '#9e9e9e';
  if (s.includes('navy')) return '#1b2a4a';
  if (s.includes('blue')) return '#1e50a2';
  if (s.includes('red')) return '#b91c1c';
  if (s.includes('green')) return '#166534';
  if (s.includes('pink')) return '#db2777';
  if (s.includes('taupe')) return '#b38b6d';
  if (s.includes('natural')) return '#f5f0e6';
  if (s.includes('yellow') || s.includes('gold')) return '#eab308';
  return '#444444';
}

let prodCount=0;
for(const p of products){
  prodCount++;
  if(prodCount % 1000 === 0) console.log(`  ... compiled ${prodCount} / ${products.length} product pages`);
  const details = getProductDetails(p);
  const typeLabel = TYPES.find(x => x[0] === p.category)?.[1] || 'Graphic Apparel';
  const partnerName = p.url && p.url.includes("myspreadshop.com") ? "Spreadshop Verified" : (p.url && p.url.includes("printify.me") ? "Printify Verified" : "Official Store Verified");

  const body = `<div class="wrap pdp-wrap">
    <nav class="breadcrumb pdp-breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="crumb-sep">/</span>
      <a href="/types/${p.category}/">${esc(typeLabel)}</a>
      <span class="crumb-sep">/</span>
      <span class="current-crumb">${esc(p.design)}</span>
    </nav>

    <section class="detail pdp-showcase">
      <div class="pdp-gallery-col">
        <div class="pdp-main-image-wrap">
          <img class="pdp-main-image" src="${esc(p.image)}" alt="${esc(p.name)}" width="600" height="600" loading="eager" decoding="async">
          <div class="pdp-image-badge">⚡ ${esc(partnerName)}</div>
        </div>
      </div>

      <div class="detail-info pdp-action-col">
        <div class="pdp-top-badge-row">
          <span class="pdp-category-pill">${esc(typeLabel)}</span>
          <span class="pdp-stock-pill">✓ Made to Order · In Stock</span>
        </div>

        <h1 class="pdp-title">${esc(p.design)}</h1>
        <div class="pdp-subtitle">${esc(p.productType)}</div>

        <div class="pdp-price-box">
          <div class="pdp-price-amount">$${p.price.toFixed(2)}</div>
          <div class="pdp-shipping-note">Free shipping on orders $75+ · Dispatched in 2-3 business days</div>
        </div>

        <div class="pdp-cta-container">
          <a class="btn-pdp-buy" href="${esc(p.url)}" target="_blank" rel="noopener">
            <span>Buy Now on Official Store — $${p.price.toFixed(2)}</span>
            <span class="cta-arrow">↗</span>
          </a>
          <div class="pdp-cta-subtext">
            <span>🔒 Direct to Official Shop</span>
            <span>⚡ Select Size &amp; Color at Checkout</span>
            <span>↩️ 30-Day Guarantee</span>
          </div>
        </div>

        <div class="pdp-quick-options">
          <div class="pdp-opt-row">
            <span class="pdp-opt-label">Available Sizes:</span>
            <div class="pdp-size-badges">
              ${(p.sizes.length ? p.sizes : ['S','M','L','XL','2XL','3XL']).map(s => `<span class="opt-badge">${esc(s)}</span>`).join('')}
            </div>
          </div>
          <div class="pdp-opt-row">
            <span class="pdp-opt-label">Available Colors:</span>
            <div class="pdp-color-badges">
              ${(p.colors.length ? p.colors : ['Black','White']).map(c => `<span class="opt-badge">${esc(c)}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="pdp-mini-trust">
          <span class="trust-badge-pill">🛡️ Guaranteed Secure Checkout</span>
          <span class="trust-badge-pill">📦 Tracked Door-to-Door</span>
          <span class="trust-badge-pill">★ Google Reviews Partner</span>
        </div>
      </div>
    </section>

    <section class="pdp-bottom-details">
      <div class="pdp-details-grid">
        <div class="pdp-detail-card">
          <h3>About This Graphic Design</h3>
          <p>${details.desc}</p>
          <div class="detail-tags">
            ${p.themes.map(id => `<a href="/collections/${id}/">${THEMES.find(t => t[0] === id)?.[1] || 'Urban'}</a>`).join('')}
          </div>
        </div>

        <div class="pdp-detail-card">
          <h3>${details.specLabel}</h3>
          <p>${details.specValue}</p>
          <dl class="pdp-specs-list">
            <dt>Fit &amp; Audience:</dt><dd>${esc(p.audience)}</dd>
            <dt>Production Method:</dt><dd>Eco-friendly high-density digital print</dd>
            <dt>Handling Time:</dt><dd>Custom printed &amp; dispatched in 2-3 business days</dd>
          </dl>
        </div>

        <div class="pdp-detail-card">
          <h3>Satisfaction &amp; Returns</h3>
          <p>Custom printed with vibrant archival clarity. If you are not 100% satisfied with your order, we will replace it or issue a full refund within 30 days.</p>
          <a class="pdp-policy-link" href="/returns/">Read Full Return Policy ↗</a>
        </div>
      </div>
    </section>

    ${themeShowcase(p.themes[0]||'urban','Related Designs & Styles','')}
  </div>`;

  write(p.path.slice(1)+'index.html',shell({title:p.design+' — '+p.productType,description:p.name+'. Pick your size and color and shop this graphic design at Urban Clothes Market.',path:p.path,body,meta,structured:{'@context':'https://schema.org','@type':'Product',name:p.name,image:[p.image],sku:p.id,description:p.name,brand:{'@type':'Brand',name:p.brand||'Urban Clothes Market'},offers:{'@type':'Offer',price:p.price.toFixed(2),priceCurrency:'USD',availability:'https://schema.org/InStock',url:ORIGIN+p.path,itemCondition:'https://schema.org/NewCondition',seller:{'@type':'Organization',name:'Urban Clothes Market'},shippingDetails:{'@type':'OfferShippingDetails',shippingRate:{'@type':'MonetaryAmount',value:'6.99',currency:'USD'},shippingDestination:{'@type':'DefinedRegion',addressCountry:'US'},deliveryTime:{'@type':'ShippingDeliveryTime',handlingTime:{'@type':'QuantitativeValue',minValue:1,maxValue:3,unitCode:'DAY'},transitTime:{'@type':'QuantitativeValue',minValue:3,maxValue:6,unitCode:'DAY'}}},hasMerchantReturnPolicy:{'@type':'MerchantReturnPolicy',applicableCountry:'US',returnPolicyCategory:'https://schema.org/MerchantReturnFiniteReturnWindow',merchantReturnDays:30,returnMethod:'https://schema.org/ReturnByMail',returnFees:'https://schema.org/FreeReturn',merchantReturnLink:'https://www.urbanclothesmarket.com/returns/'}}}}));
  sitemap.push(p.path);
}

write('about/index.html',shell({title:'About the Market',description:'Meet Urban Clothes Market, a collection of original graphic apparel, gifts and accessories.',path:'/about/',meta,body:`<article class="legal wrap"><div class="eyebrow">Original designs. Everyday personality.</div><h1>WELCOME TO YOUR MARKET.</h1><p>Urban Clothes Market brings our original designs together in a growing collection of graphic clothing, accessories, and gifts for people with passions.</p><h2>Find your people.</h2><p>Whether your world revolves around cats, dogs, games, cars, or making things with your own hands, there’s a corner of this market for you. Browse by theme, narrow it by product type, or hit shuffle for a fresh discovery.</p><h2>From design to your door.</h2><p>Choose a design, pick your size and color, and complete checkout. Your items are made to order and shipped to your door. Shipping costs, delivery estimates, returns, taxes and promotions are confirmed during checkout.</p><h2>A collection that keeps growing.</h2><p>The current catalog contains ${products.length.toLocaleString()} unique listings, checked ${meta.updated}. This website uses a catalog snapshot. The newest arrivals and current availability are confirmed during checkout.</p><a class="btn dark" href="/#catalog">Explore the market ↗</a></article>`}));
write('privacy/index.html',shell({title:'Privacy',description:'How Urban Clothes Market handles local favorites and third-party checkout.',path:'/privacy/',meta,body:`<article class="legal wrap"><h1>PRIVACY</h1><p>This storefront does not require an account or collect payment information. Favorites are stored in your browser on this device. You can remove them by clearing your browser’s site data.</p><h2>Images and fonts</h2><p>Product images load from our production partner’s image service. Fonts load from Google Fonts. These providers receive ordinary web requests, including your IP address. Your browser may use local caching to improve performance.</p><h2>Checkout</h2><p>Product and checkout links open our checkout partner’s site to choose options and complete your purchase. The checkout provider handles payment, fulfillment, and its own privacy policy. Hosting providers process ordinary access logs to serve and protect this site.</p><h2>Search</h2><p>Your storefront searches run in your browser. Google Search Console is used to understand search visibility; it does not add a visitor analytics tracker to this site.</p></article>`}));
write('returns/index.html',shell({title:'Returns & exchanges',description:'Find the current return and exchange terms for your Urban Clothes Market order.',path:'/returns/',meta,body:`<article class="legal wrap"><h1>RETURNS & EXCHANGES</h1><p>Your order is handled by our checkout partner. Visit the order help center for the current return policy, eligibility and instructions.</p><p>Keep your order confirmation so support can find your purchase. Available return or exchange options depend on your order and the applicable terms.</p><a class="btn dark" href="https://service.spreadshirt.com/hc/en-us/articles/115000984869?shop_name=urbanclothesmarket&shop_id=2047529&platform=na">Returns & exchanges help ↗</a></article>`}));
write('shipping/index.html',shell({title:'Shipping & delivery',description:'Confirm delivery estimates and shipping costs for Urban Clothes Market items before checkout.',path:'/shipping/',meta,body:`<article class="legal wrap"><h1>SHIPPING & DELIVERY</h1><p>Your items are made to order. Shipping costs and estimated delivery dates depend on the items, destination and delivery option you choose.</p><h2>Confirm your delivery details</h2><p>Choose your items, sizes and colors, then review the current shipping cost and estimated delivery date at checkout before ordering.</p><h2>After placing your order</h2><p>Use your order confirmation and our checkout partner’s help center for order updates and tracking information.</p><a class="btn dark" href="https://service.spreadshirt.com/hc/en-us/articles/115000993925?shop_name=urbanclothesmarket&shop_id=2047529&platform=na">Shipping & delivery help ↗</a></article>`}));

const optInScript = `
<script src="https://apis.google.com/js/platform.js?onload=renderOptIn" async defer></script>
<script>
  window.renderOptIn = function() {
    window.gapi.load('surveyoptin', function() {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('order_id') || 'UCM-' + Math.floor(100000 + Math.random() * 900000);
      const customerEmail = urlParams.get('email') || '';
      const countryCode = urlParams.get('country') || 'US';

      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);
      const yyyy = deliveryDate.getFullYear();
      const mm = String(deliveryDate.getMonth() + 1).padStart(2, '0');
      const dd = String(deliveryDate.getDate()).padStart(2, '0');
      const estDeliveryDate = urlParams.get('delivery_date') || (yyyy + '-' + mm + '-' + dd);

      window.gapi.surveyoptin.render({
        "merchant_id": 5871199587,
        "order_id": orderId,
        "email": customerEmail,
        "delivery_country": countryCode,
        "estimated_delivery_date": estDeliveryDate,
        "opt_in_style": "CENTER_DIALOG"
      });
    });
  };
</script>
`;

const confirmationBody = `<article class="legal wrap"><div class="eyebrow" style="color:var(--accent,#d5fa42);font-weight:700">Order Confirmed</div><h1 style="margin-top:8px">THANK YOU FOR YOUR ORDER!</h1><p>Your order has been received and is being prepared with our production partners. You will receive an email confirmation with tracking information once your package ships.</p><div style="background:#1e1e1e;border:1px solid #333;border-radius:12px;padding:24px;margin:24px 0"><h3 style="margin-top:0">Order Status &amp; Delivery</h3><ul style="line-height:1.8;padding-left:20px;color:#ccc"><li><strong>Production:</strong> Your items are custom made to order (typically 2-3 business days).</li><li><strong>Estimated Delivery:</strong> 3-5 business days after fulfillment.</li><li><strong>Google Customer Reviews:</strong> We value your genuine feedback. A Google Customer Review survey will appear to let you rate your shopping experience.</li></ul></div><p><a class="btn dark" href="/#catalog">Continue Shopping ↗</a> &nbsp; <a class="btn" href="/shipping/">Shipping Details</a></p></article>` + optInScript;

for(const p of ['/order-confirmation/','/checkout/confirmation/','/confirmation/']){
  write(p.slice(1)+'index.html', shell({
    title: 'Order Confirmation',
    description: 'Thank you for your order at Urban Clothes Market.',
    path: p,
    meta,
    robots: 'noindex,follow',
    body: confirmationBody
  }));
  sitemap.push(p);
}

write('robots.txt','User-agent: *\nAllow: /\nDisallow: /catalog/\nSitemap: '+ORIGIN+'/sitemap.xml\n');
const chunks=[];
for(let i=0;i<sitemap.length;i+=40000){
  const filename='sitemap-'+(chunks.length+1)+'.xml';
  chunks.push(filename);
  write(filename,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+sitemap.slice(i,i+40000).map(p=>'<url><loc>'+ORIGIN+esc(p)+'</loc></url>').join('')+'</urlset>');
}
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+chunks.map(file=>'<sitemap><loc>'+ORIGIN+'/'+file+'</loc></sitemap>').join('')+'</sitemapindex>');


fs.writeFileSync('data/build-report.json',JSON.stringify({count:products.length,designs:designs.length,types:meta.typeCounts,themes:meta.themeCounts,pages:sitemap.length,indexBytes:fs.statSync(path.join(root,'catalog/index.json')).size},null,2));
console.log(JSON.stringify({products:products.length,designs:designs.length,pages:sitemap.length,indexBytes:fs.statSync(path.join(root,'catalog/index.json')).size}));

// Automatically synchronize compiled dist files to repo root for GitHub Pages live serving
if (!isHomeOnly) {
  console.log(`Synchronizing ${generatedFiles.size} compiled build artifacts to repo root for 100% zero-404 live serving...`);
  let synced = 0;
  for (const fullPath of generatedFiles) {
    const rel = path.relative(root, fullPath);
    const target = path.resolve(rel);
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(fullPath, target);
    synced++;
  }
  // Ensure root catalog directory is always 100% in sync with dist/catalog
  if (fs.existsSync(path.join(root, 'catalog'))) {
    fs.cpSync(path.join(root, 'catalog'), 'catalog', { recursive: true });
  }
  console.log(`✓ Successfully synchronized ${synced} compiled pages and assets directly to repo root!`);
}
