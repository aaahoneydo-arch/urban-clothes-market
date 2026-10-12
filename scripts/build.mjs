import fs from 'node:fs';
import path from 'node:path';
if(fs.existsSync('public')) fs.cpSync('public','dist',{recursive:true});

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
function write(file,data){
  const target=path.join(root,file);
  generatedFiles.add(target);
  fs.mkdirSync(path.dirname(target),{recursive:true});
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

// Row showcase generators
const typeShowcase = (id, title, subtitle) => {
  const matching = products.filter(p => id === 'kids' ? p.kids : p.category === id);
  const uniqueItems = uniqueByDesign(matching);
  const count = matching.length;
  return showcaseRow({
    id,
    title,
    subtitle,
    count,
    link: `/types/${id}/`,
    isType: true,
    products: uniqueItems.slice(0, 10)
  });
};

const themeShowcase = (id, title, subtitle) => {
  const matching = products.filter(p => id === 'all' || p.themes.includes(id));
  const uniqueItems = uniqueByDesign(matching);
  const count = matching.length;
  return showcaseRow({
    id,
    title,
    subtitle,
    count,
    link: `/collections/${id}/`,
    isType: false,
    products: uniqueItems.slice(0, 10)
  });
};

const homeBody = `
<div class="wrap">
  <!-- TOP QUICK-JUMP CATEGORY PILLS BAR -->
  <div class="top-nav-strip">
    <div class="top-strip-left">
      <span class="live-indicator">⚡ <strong>${products.length.toLocaleString()}+</strong> Original Graphic Items Across <strong>13</strong> Variations</span>
    </div>
    <div class="top-strip-right">
      <button type="button" class="btn-surprise-pill" data-surprise aria-label="Surprise me with random picks">${icon('shuffle')} Surprise Me</button>
    </div>
  </div>
  ${categoryChips(meta)}

  <!-- ALL 13 ITEM VARIATION SECTIONS (SCROLLABLE TRACKS WITH LIVE SHUFFLE) -->
  ${typeShowcase('tees', 'Tees, Tanks & Graphic Shirts', 'Classic heavyweight tees, slim-fit premium shirts, and athletic tanks.')}
  ${typeShowcase('hoodies', 'Hoodies & Premium Sweatshirts', 'Cozy fleece pullovers, contrast hoodies, and zip sweatshirts.')}
  ${typeShowcase('hats', 'Hats, Caps & Beanies', 'Snapbacks, vintage baseball caps, trucker hats, and knit beanies.')}
  ${typeShowcase('mugs', 'Mugs, Tumblers & Drinkware', 'Ceramic coffee mugs, insulated travel tumblers, and beverage gear.')}
  ${typeShowcase('bags', 'Bags, Backpacks & Totes', 'Canvas totes, gym duffels, drawstring bags, and travel pouches.')}
  ${typeShowcase('stickers', 'Stickers, Decals & Buttons', 'Durable vinyl die-cut stickers for laptops, water bottles, and cars.')}

  <!-- MID-PAGE SEARCH & DISCOVERY BAR #1 -->
  ${discoveryBar({
    id: 'discovery-mid1',
    title: 'Looking for a Specific Graphic or Theme?',
    subtitle: 'Search across all 78,000+ items or hit surprise me for an instant random discovery mix.',
    placeholder: 'Search 78,000+ items (cats, cars, gaming, dogs, sarcastic, retro...)'
  })}

  ${typeShowcase('jackets', 'Jackets, Windbreakers & Outerwear', 'Weather-resistant lightweight jackets, track jackets, and zip layers.')}
  ${typeShowcase('art', 'Posters, Prints & Wall Art', 'High-resolution archival paper posters and graphic wall art prints.')}
  ${typeShowcase('home', 'Home, Pillows & Kitchen Gear', 'Throw pillows, aprons, mousepads, holiday ornaments, and magnets.')}
  ${typeShowcase('pets', 'Pet Gear & Dog Bandanas', 'Graphic pet bandanas and accessories for your four-legged best friends.')}
  ${typeShowcase('kids', 'Kids, Toddler & Baby Gear', 'Youth tees, toddler apparel, and organic baby bodysuits.')}
  ${typeShowcase('bottoms', 'Shorts, Joggers & Activewear', 'Comfortable cotton joggers, athletic shorts, and loungewear.')}
  ${typeShowcase('accessories', 'Accessories & Keychains', 'Embroidered jet tags, novelty keychains, and everyday add-ons.')}

  <!-- INTERACTIVE CATALOG BROWSER & DEEP FILTERS -->
  <section class="catalog-head" id="catalog">
    <div class="section-head">
      <div>
        <div class="sub">INSTANT INVENTORY EXPLORER · ALL 78,000+ ITEMS</div>
        <h2>Filter &amp; Discover Entire Archive</h2>
        <p>Narrow by item variation, passion theme, budget, or brand. Click shuffle for a brand new discovery mix anytime.</p>
      </div>
      <div class="row-actions">
        <button class="shuffle" data-shuffle type="button">${icon('shuffle')} Shuffle All</button>
        <a class="text-link" href="/collections/all/">Browse Full Archive ↗</a>
      </div>
    </div>
    ${filters(meta).replace('__CARDS__', uniqueByDesign(products.filter(p=>p.category==='tees')).slice(0, 24).map(card).join(''))}
  </section>

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
  ${themeShowcase('cats', 'Cat Lovers Edit', 'For the ones who know who really runs the house.')}
  ${themeShowcase('dogs', 'Dog Lovers Edit', 'Wear a little love for your four-legged best friend.')}
  ${themeShowcase('gamers', 'Gamers & Retro Arcade', 'For your next game night, boss fight, or victory lap.')}
  ${themeShowcase('cars', 'Car Enthusiasts & Garage Crew', 'For the garage crowd and the open-road dreamers.')}
  ${themeShowcase('humor', 'Funny & Sarcastic', 'Good jokes, deadpan humor, and great conversation starters.')}
  ${themeShowcase('diy', 'DIY, Makers & Handymen', 'Made for people who would rather build it themselves.')}
  ${themeShowcase('political', 'Satire & Commentary', 'A little commentary, sharp wit, and a lot of personality.')}

  <!-- BOTTOM SEARCH & DISCOVERY BANNER -->
  ${discoveryBar({
    id: 'discovery-bottom',
    title: 'Ready to Find Your Next Favorite?',
    subtitle: 'Search across 78,000+ items or hit surprise me to discover something unexpected.',
    placeholder: 'Search 78,000+ items or enter a theme...'
  })}
</div>
`;

// Write index.html
write('index.html', shell({
  title: 'Graphic Clothing, Gifts & Massive Inventory Showcase',
  description: `Shop ${products.length.toLocaleString()}+ graphic tees, hoodies, mugs, stickers, and gifts across 13 variations for cat lovers, dog lovers, gamers, cars and more at Urban Clothes Market.`,
  body: homeBody,
  meta,
  structured: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Urban Clothes Market',
    url: ORIGIN
  }
}));

// Copy index.html, style.css, app.js directly to root
fs.copyFileSync(path.join(root,'index.html'), 'index.html');
fs.copyFileSync(path.join(root,'style.css'), 'style.css');
fs.copyFileSync(path.join(root,'app.js'), 'app.js');

if(isHomeOnly){
  console.log('Homepage, styles, and scripts compiled and synced to root successfully!');
  process.exit(0);
}

// Full build continued:
let sitemap=['/','/about/'];

function collection(id,label,kind,description,group){
  const base='/'+kind+'/'+id+'/';
  const pageSize=24,pages=Math.max(1,Math.ceil(group.length/pageSize));
  for(let page=1;page<=pages;page++){
    const pagePath=page===1?base:base+'page/'+page+'/';
    const selected=group.slice((page-1)*pageSize,page*pageSize);
    const intro=`<div class="wrap"><div class="breadcrumb"><a href="/">Home</a> / ${kind==='types'?'Product variations':'Collections'} / ${esc(label)}</div><section class="collection-intro"><div class="eyebrow">Find your own kind of original</div><h1>${esc(label)}</h1><p>${esc(description)}</p></section><section id="catalog">${filters(meta,{type:kind==='types'?id:'',theme:kind==='collections'?id:''}).replace('__CARDS__',selected.map(card).join(''))}<nav aria-label="Collection pages" class="pagination">${page>1?`<a class="btn" href="${page===2?base:base+'page/'+(page-1)+'/'}">← Page ${page-1}</a>`:''}<span>Catalog page ${page} of ${pages}</span>${page<pages?`<a class="btn" href="${base}page/${page+1}/">Page ${page+1} →</a>`:''}</nav></section><section class="section"><h2 style="font:700 35px var(--display)">Explore another variation</h2>${themeTiles(meta)}</section></div>`;
    write(pagePath.slice(1)+'index.html',shell({title:label+(page>1?' — Page '+page:''),description,path:pagePath,body:intro,meta,structured:{'@context':'https://schema.org','@type':'CollectionPage',name:label,url:ORIGIN+pagePath}}));
    sitemap.push(pagePath);
  }
}

for(const [id,label,,description] of THEMES) collection(id,label,'collections',description,products.filter(p=>id==='all'||p.themes.includes(id)));
for(const [id,label] of TYPES) collection(id,label,'types','Explore '+label.toLowerCase()+' featuring original graphic designs. Combine a theme with an item variation to find your perfect match.',products.filter(p=>id==='kids'?p.kids:p.category===id));

let prodCount=0;
for(const p of products){
  prodCount++;
  if(prodCount % 5000 === 0) console.log(`  ... compiled ${prodCount} / ${products.length} product pages`);
  const buyUrl = (p.url && !p.url.includes('urbanclothesmarket.com')) ? p.url : `${SHOP}/?q=${encodeURIComponent(p.design)}`;
  const trustBadgeHtml = `<div class="payment-trust-bar"><div class="trust-heading"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>Guaranteed Safe &amp; Secure Checkout</span></div><div class="payment-icons"><span class="pay-badge gpay" title="Google Pay Accepted at Checkout"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.2C3.3 21.4 7.3 24 12 24z"/><path fill="#FBBC05" d="M5.3 14.1c-.2-.7-.4-1.4-.4-2.1s.2-1.4.4-2.1V6.7H1.2C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l4.1-3.2z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.6 1.2 6.7l4.1 3.2c.9-2.9 3.6-5.1 6.7-5.1z"/></svg><strong>Pay</strong></span><span class="pay-badge applepay" title="Apple Pay Accepted at Checkout"><svg viewBox="0 0 42 18" width="40" height="17"><path fill="#000" d="M6.2 9.1c0-1.1.6-2.1 1.2-2.7-.6-.8-1.5-1.3-2.5-1.3-1.2 0-1.9.7-2.5.7-.7 0-1.5-.7-2.4-.7C-1.2 5.1-2.4 6.4-2.4 8.7c0 2.4 2.1 5.8 3.8 5.8.7 0 1.2-.5 2-.5.8 0 1.2.5 2 .5 1.4 0 2.4-1.5 3.2-2.7-.8-.4-1.4-1.3-1.4-2.7zm-1.4-5.2c.6-.7.9-1.6.8-2.6-.8 0-1.8.6-2.3 1.3-.5.6-.8 1.5-.7 2.4.9.1 1.6-.4 2.2-1.1z"/><text x="11" y="14" fill="#000" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="700" font-size="13">Pay</text></svg></span><span class="pay-badge paypal" title="PayPal Accepted at Checkout"><span style="color:#003087;font-weight:900;font-style:italic">Pay</span><span style="color:#0079C1;font-weight:900;font-style:italic">Pal</span></span><span class="pay-badge card" title="Visa / Mastercard Accepted"><svg viewBox="0 0 24 24" width="16" height="16"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" fill="none"/><line x1="2" y1="10" x2="22" y2="10" stroke="currentColor"/></svg><span>Cards</span></span></div><div class="trust-note">Fast 1-click checkout with Google Pay, Apple Pay &amp; PayPal confirmed at checkout.</div></div>`;
  const body=`<div class="wrap"><div class="breadcrumb"><a href="/">Home</a> / <a href="/types/${p.category}/">${TYPES.find(x=>x[0]===p.category)?.[1]||'Apparel'}</a> / ${esc(p.design)}</div><section class="detail">${productGallery(p,photos)}<div class="detail-info"><div class="eyebrow">Wear your personality</div><h1>${esc(p.design)}</h1><h2>${esc(p.productType)}</h2><div class="detail-price">$${p.price.toFixed(2)}</div><small>USD · Catalog price checked ${meta.updated}</small><p>A ${esc(p.productType.toLowerCase())} featuring the “${esc(p.design)}” design. Pick your size and color, then continue to checkout.</p><a class="btn dark" href="${esc(buyUrl)}">Pick size &amp; colors ${icon('arrow')}</a>${trustBadgeHtml}<p style="font-size:11px">Choose your options, then complete checkout. Final prices, availability, shipping and any active promotions are confirmed there.</p><dl><dt>Who it's for</dt><dd>${esc(p.audience)}</dd><dt>Sizes offered in the catalog</dt><dd>${p.sizes.length?p.sizes.map(esc).join(' · '):'Pick options at checkout'}</dd><dt>Colors shown in the catalog</dt><dd>${p.colors.length?p.colors.map(esc).join(' · '):'Pick options at checkout'}</dd></dl><div class="detail-tags">${p.themes.map(id=>`<a href="/collections/${id}/">${THEMES.find(t=>t[0]===id)?.[1]||'Urban'}</a>`).join('')}</div></div></section>${themeShowcase(p.themes[0]||'urban','Related Designs','')}</div>`;
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
write('404.html',shell({title:'Page not found',description:'Find your next favorite at Urban Clothes Market.',path:'/404.html',meta,robots:'noindex,follow',body:'<div class="legal wrap"><h1>THIS WAY TO THE MARKET.</h1><p>That page could not be found.</p><a class="btn dark" href="/">Back to the market ↗</a></div>'}));
write('_headers','/catalog/*\n  Cache-Control: public, max-age=3600\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');

fs.writeFileSync('data/build-report.json',JSON.stringify({count:products.length,designs:designs.length,types:meta.typeCounts,themes:meta.themeCounts,pages:sitemap.length,indexBytes:fs.statSync(path.join(root,'catalog/index.json')).size},null,2));
console.log(JSON.stringify({products:products.length,designs:designs.length,pages:sitemap.length,indexBytes:fs.statSync(path.join(root,'catalog/index.json')).size}));
