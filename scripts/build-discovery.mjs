import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

import { normalize, TYPES, THEMES } from '../src/catalog-model.mjs';
import { shell, card, header, footer, themeTiles, filters, esc, icon, ORIGIN, SHOP } from '../src/templates.mjs';

const rawCatalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/catalog.json'), 'utf8'));
const products = normalize(rawCatalog);
const sync = JSON.parse(fs.readFileSync(path.join(rootDir, 'data/catalog-sync.json'), 'utf8'));
const meta = { count: products.length, updated: sync.checkedDate, typeCounts: {}, themeCounts: {}, themeHero: {} };

for (const [id] of TYPES) meta.typeCounts[id] = products.filter(p => id === 'kids' ? p.kids : p.category === id).length;
for (const [id] of THEMES) {
  const group = products.filter(p => id === 'all' || p.themes.includes(id));
  meta.themeCounts[id] = group.length;
  meta.themeHero[id] = group.find(p => p.category === 'tees' && !p.kids) || group[0];
}
meta.hero = products.find(p => /home is where the cat sits/i.test(p.design) && /premium hoodie/i.test(p.productType) && !p.kids) || products[0];

console.log('=== 1. GENERATING GOOGLE MERCHANT CENTER XML FEED ===');
function buildGoogleMerchantFeed() {
  const xmlItems = products.map(p => {
    const fullUrl = ORIGIN + p.path;
    const catMapping = {
      tees: 'Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops &gt; T-Shirts',
      hoodies: 'Apparel &amp; Accessories &gt; Clothing &gt; Outerwear &gt; Coats &amp; Jackets',
      jackets: 'Apparel &amp; Accessories &gt; Clothing &gt; Outerwear &gt; Coats &amp; Jackets',
      hats: 'Apparel &amp; Accessories &gt; Clothing Accessories &gt; Hats',
      mugs: 'Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Tableware &gt; Drinkware &gt; Mugs',
      bags: 'Luggage &amp; Bags &gt; Handbags, Wallets &amp; Cases &gt; Tote Bags',
      stickers: 'Home &amp; Garden &gt; Decor &gt; Wall Accents &gt; Wall Decals',
      bottoms: 'Apparel &amp; Accessories &gt; Clothing &gt; Pants',
      pets: 'Animals &amp; Pet Supplies &gt; Pet Supplies',
      accessories: 'Apparel &amp; Accessories &gt; Clothing Accessories',
      home: 'Home &amp; Garden &gt; Decor',
      art: 'Home &amp; Garden &gt; Decor &gt; Artwork &gt; Posters, Prints, &amp; Visual Artwork',
      kids: 'Apparel &amp; Accessories &gt; Clothing &gt; Baby &amp; Toddler Clothing'
    }[p.category] || 'Apparel &amp; Accessories &gt; Clothing';

    return `    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${esc(p.name)}. Authentic print-on-demand graphic apparel and lifestyle gifts by Urban Clothes Market. Made to order with premium materials and fast direct shipping.</g:description>
      <g:link>${fullUrl}</g:link>
      <g:image_link>${esc(p.image)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${p.price.toFixed(2)} USD</g:price>
      <g:brand>Urban Clothes Market</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${catMapping}</g:google_product_category>
    </item>`;
  }).join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Urban Clothes Market - Official Product Feed</title>
    <link>${ORIGIN}</link>
    <description>Original graphic tees, heavyweight streetwear hoodies, caps, mugs, and lifestyle gear.</description>
${xmlItems}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(distDir, 'google-merchant-feed.xml'), xmlContent, 'utf8');
  console.log(`  ✓ Written dist/google-merchant-feed.xml (${(xmlContent.length / 1024 / 1024).toFixed(2)} MB, ${products.length} items)`);
}
buildGoogleMerchantFeed();

console.log('=== 2. GENERATING PINTEREST BULK CSV CATALOG ===');
function buildPinterestCatalog() {
  const headers = ['id', 'title', 'description', 'link', 'image_link', 'price', 'availability', 'condition', 'brand', 'google_product_category'];
  const rows = [headers.join(',')];

  function csvCell(str) {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  }

  for (const p of products) {
    const fullUrl = ORIGIN + p.path;
    const desc = `${p.name}. Discover everyday graphic clothing and gifts at Urban Clothes Market. High-density print on demand, true to size fit, ships direct to your door.`;
    rows.push([
      csvCell(p.id),
      csvCell(p.name),
      csvCell(desc),
      csvCell(fullUrl),
      csvCell(p.image),
      csvCell(`${p.price.toFixed(2)} USD`),
      csvCell('in_stock'),
      csvCell('new'),
      csvCell('Urban Clothes Market'),
      csvCell('Apparel & Accessories > Clothing')
    ].join(','));
  }

  const csvContent = rows.join('\n');
  fs.writeFileSync(path.join(distDir, 'pinterest-catalog.csv'), csvContent, 'utf8');
  console.log(`  ✓ Written dist/pinterest-catalog.csv (${(csvContent.length / 1024 / 1024).toFixed(2)} MB, ${products.length} items)`);
}
buildPinterestCatalog();

console.log('=== 3. GENERATING HIGH-INTENT BUYER GIFT GUIDES (WITH FAQ SCHEMA) ===');
const GIFT_GUIDES = [
  {
    slug: 'gamers',
    themeId: 'gamers',
    title: 'Best Gifts for Gamers & Retro Arcade Fans Under $25',
    metaTitle: 'Best Gifts for Gamers & Arcade Fans (Under $25)',
    subhead: 'Gamer Graphic Tees, Synthwave Hoodies & Pixel Art Gifts',
    description: 'Looking for the perfect gift for gamers, streamers, or retro arcade fans? Explore top-rated gamer tees, pixel art hoodies, and gaming mugs under $25 at Urban Clothes Market.',
    leadText: 'Finding genuine gifts for gamers can be tough when everyone already owns the latest games. Our curated gamer apparel collection features timeless pixel art badges, 80s arcade synthwave aesthetics, and witty gamer humor printed on comfortable, durable daily streetwear.',
    faqs: [
      { q: 'What are the most popular gamer gifts under $25?', a: 'Top picks include the "Level 0 NOOB 1% HP" arcade badge tee ($18.99), "Eat Sleep Game Repeat" graphic t-shirt ($18.99), and retro arcade coffee mugs ($14.99).' },
      { q: 'What sizes are offered for gamer tees and hoodies?', a: 'Standard and premium gamer apparel runs from Unisex Small up to 5XL with relaxed, true-to-size retail fits.' },
      { q: 'How fast is made-to-order delivery?', a: 'Orders are freshly printed within 2-4 business days and shipped with direct parcel tracking across the US and worldwide.' }
    ]
  },
  {
    slug: 'cats',
    themeId: 'cats',
    title: 'Gifts for Cat Lovers: Sarcastic Cat Hoodies, Tees & Mugs',
    metaTitle: 'Unique Gifts for Cat Lovers & Cat Moms/Dads',
    subhead: 'Cozy Feline Apparel & Coffee Mugs for Animal Obsessives',
    description: 'Shop the best gifts for cat lovers, cat moms, and cat dads. Funny sarcastic cat hoodies, comfortable graphic tees, and ceramic drinkware designed for true cat people.',
    leadText: 'Cat people know who really runs the house. Our cat lovers gift edit celebrates feline attitude, subtle judgments, and cozy couch vibes with premium combed cotton tees and ultra-soft fleece hoodies.',
    faqs: [
      { q: 'What is the top-selling cat lover design?', a: 'The "Home Is Where the Cat Sits" unisex hoodie ($30.99) and "Distracted by Cats" classic tee ($18.99) are customer favorites.' },
      { q: 'Can these cat shirts and hoodies be machine washed?', a: 'Yes! All items are printed with high-durability inks that remain vibrant through repeated washing. Wash inside-out in cold water for longest life.' }
    ]
  },
  {
    slug: 'dogs',
    themeId: 'dogs',
    title: 'Gifts for Dog Lovers: Best Friend With Paws Graphic Tees',
    metaTitle: 'Best Gifts for Dog Lovers, Dog Dads & Pet Owners',
    subhead: 'Everyday Dog Lover Apparel, Tote Bags & Caps',
    description: 'Celebrate your four-legged best friend with dog lover gifts from Urban Clothes Market. Discover Best Friend With Paws tees, Dog Dad vintage shirts, and outdoor pet gear.',
    leadText: 'Whether you are heading to the dog park or lounging with your golden retriever, our dog lover collection brings unconditional pet love into high-quality daily streetwear and gifts.',
    faqs: [
      { q: 'What makes a great gift for dog dads?', a: 'The vintage "Dog Dad" relaxed fit tee ($18.99) and "Lift Heavy Pet Dogs" gym shirt ($18.99) make ideal, affordable gifts.' },
      { q: 'Are these designs available on hats and accessories?', a: 'Yes, selected dog designs are also available on cotton twill snapbacks, rope caps ($20.99), and durable canvas tote bags ($14.99).' }
    ]
  },
  {
    slug: 'cars',
    themeId: 'cars',
    title: 'Car Enthusiast & Mechanic Gifts: Backroad Therapy Apparel',
    metaTitle: 'Gifts for Car Guys, Mechanics & Garage Crew',
    subhead: 'Project Car Shirts, Heavyweight Hoodies & Garage Gear',
    description: 'Find gifts for car enthusiasts, mechanics, and project car builders. Premium graphic t-shirts and hoodies celebrating backroad driving and garage culture.',
    leadText: 'For the ones who spend Friday nights turning wrenches and weekends hunting winding asphalt. Our car culture line speaks fluent horsepower, boost, and project car therapy.',
    faqs: [
      { q: 'What are the best gifts for someone who loves project cars?', a: '"Backroad Therapy" ($18.99) and "I Brake For Project Cars" ($18.99) tees and Gildan Heavyweight Hoodies ($32.99) are must-haves.' },
      { q: 'Do these shirts hold up to workshop and garage wear?', a: 'Yes. We use heavyweight pre-shrunk cotton options like Gildan and Bella+Canvas that withstand active everyday garage life.' }
    ]
  },
  {
    slug: 'trades',
    themeId: 'diy',
    title: 'DIY & Tradesmen Gifts: Measure Twice Cuss Once Gear',
    metaTitle: 'Funny Gifts for Carpenters, Electricians & DIY Makers',
    subhead: 'Power Tool Apparel, Jobsite Hoodies & Workshop Mugs',
    description: 'Shop funny gifts for carpenters, plumbers, electricians, and DIY makers. High-density graphic apparel featuring jobsite humor and maker pride.',
    leadText: 'Craftsmanship, precision, and honest jobsite humor. Designed for tradesmen, makers, and handy homeowners who know that a hammer and some colorful language can solve almost anything.',
    faqs: [
      { q: 'What is the most popular carpenter gift shirt?', a: 'The "Measure Twice. Cuss Once." t-shirt ($18.99) and Champion 1/4 zip pullover ($41.99) are our #1 trade picks.' },
      { q: 'Are there apron or mug options for workshop gifts?', a: 'Yes, durable adjustable workshop aprons ($18.99) and glossy 15oz coffee mugs ($14.99) are available across all trade designs.' }
    ]
  },
  {
    slug: 'humor',
    themeId: 'humor',
    title: 'Funny & Sarcastic Humor Shirts: Sarcastic Sayings & Mugs',
    metaTitle: 'Funny Sarcastic T-Shirts & Office Humor Gifts',
    subhead: 'Witty Graphic Apparel for Friends, Coworkers & Introverts',
    description: 'Shop funny and sarcastic t-shirts, hoodies, and desk mugs. High-converting conversation starters featuring relatable humor, introversion, and work satire.',
    leadText: 'Good jokes. Great conversation starters. From "Per My Last Email" to "Too Peoply Outside", wear your sharp wit on comfortable streetwear that speaks before you even open your mouth.',
    faqs: [
      { q: 'What are great funny gifts for coworkers or white elephant parties?', a: '"Chaos Coordinator" and "Per My Last Email" tees ($18.99) or desk coffee mugs ($14.99) are universally loved crowd favorites.' },
      { q: 'Are return policies supported if the gift does not fit?', a: 'Yes, our 30-day satisfaction guarantee and straightforward exchange process makes gift-giving stress-free.' }
    ]
  }
];

const newSitemapUrls = [];

for (const guide of GIFT_GUIDES) {
  const guidePath = `/gifts/${guide.slug}/`;
  const guideDir = path.join(distDir, 'gifts', guide.slug);
  fs.mkdirSync(guideDir, { recursive: true });

  const matchingProds = products
    .filter(p => p.themes.includes(guide.themeId))
    .slice(0, 36);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: guide.title,
    description: guide.description,
    url: ORIGIN + guidePath
  };

  const combinedSchema = [collectionSchema, faqSchema];

  const guideHtml = `<div class="wrap">
    <div class="breadcrumb"><a href="/">Home</a> / <a href="/#collections">Gift Guides</a> / ${esc(guide.title)}</div>
    <section class="collection-intro" style="margin-bottom: 2rem;">
      <div class="eyebrow" style="color: #38bdf8; font-weight: 800; text-transform: uppercase;">🎁 Curated Gift Guide • Under $25 Picks</div>
      <h1 style="font-size: 2.25rem; font-weight: 900; line-height: 1.2; margin-top: 0.25rem;">${esc(guide.title)}</h1>
      <p style="font-size: 1.1rem; color: #cbd5e1; max-width: 840px; margin-top: 0.75rem; line-height: 1.6;">${esc(guide.leadText)}</p>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;">
        <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: #38bdf8;">✓ Direct Made-To-Order</span>
        <span style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: #4ade80;">✓ Reduced Creator Margins ($1–$3 Profit)</span>
        <span style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: #fbbf24;">✓ Sizing XS to 5XL</span>
      </div>
    </section>

    <!-- Product Grid -->
    <section id="catalog" style="margin-bottom: 3.5rem;">
      <div class="results-top" style="margin-bottom: 1.5rem;">
        <span id="result-count" style="font-weight: 800; font-size: 1.1rem; color: #fff;">Featured Top Picks (${matchingProds.length} Designs)</span>
        <a href="${SHOP}/all" class="btn" style="text-decoration: none;" target="_blank" rel="noopener">Browse Full Catalog ↗</a>
      </div>
      <div class="grid">${matchingProds.map(card).join('')}</div>
    </section>

    <!-- Buyer Guide & FAQ Section -->
    <section style="background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 2rem; margin-bottom: 3.5rem;">
      <h2 style="font-size: 1.6rem; font-weight: 900; color: #fff; margin-bottom: 1rem;">Frequently Asked Buyer Questions</h2>
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${guide.faqs.map(f => `
          <div style="border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: #38bdf8; margin: 0 0 0.4rem 0;">${esc(f.q)}</h3>
            <p style="font-size: 0.95rem; color: #94a3b8; margin: 0; line-height: 1.5;">${esc(f.a)}</p>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Explore More -->
    <section class="section">
      <h2 style="font: 700 35px var(--display)">Explore other gift categories</h2>
      ${themeTiles(meta)}
    </section>
  </div>`;

  const finalHtml = shell({
    title: guide.metaTitle,
    description: guide.description,
    path: guidePath,
    body: guideHtml,
    meta,
    structured: combinedSchema
  });

  fs.writeFileSync(path.join(guideDir, 'index.html'), finalHtml, 'utf8');
  console.log(`  ✓ Built gift guide: ${guidePath}`);
  newSitemapUrls.push(guidePath);
}

// 4. Update Sitemap with new URLs
console.log('=== 4. UPDATING SITEMAP WITH NEW GIFT GUIDES ===');
const sitemap1Path = path.join(distDir, 'sitemap-1.xml');
if (fs.existsSync(sitemap1Path)) {
  let sitemapContent = fs.readFileSync(sitemap1Path, 'utf8');
  for (const url of newSitemapUrls) {
    const locTag = `<url><loc>${ORIGIN}${url}</loc></url>`;
    if (!sitemapContent.includes(locTag)) {
      sitemapContent = sitemapContent.replace('</urlset>', `${locTag}</urlset>`);
    }
  }
  fs.writeFileSync(sitemap1Path, sitemapContent, 'utf8');
  console.log('  ✓ Added new gift guide routes to dist/sitemap-1.xml');
}

console.log('=== DISCOVERY ENGINE BUILD COMPLETE ===');
