import {TYPES,THEMES} from './catalog-model.mjs';
export const ORIGIN='https://www.urbanclothesmarket.com';
export const SHOP='https://urbanclothesmarket.myspreadshop.com';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const icon=(name)=>'<svg aria-hidden="true" viewBox="0 0 24 24">'+({arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',shuffle:'<path d="m16 3 4 4-4 4M4 7h3c5 0 5 10 10 10h3m-4-4 4 4-4 4M4 17h3c2 0 3-2 4-4m3-5c1-1 2-1 3-1h3"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>'}[name]||'')+'</svg>';

export function card(p){
  const isApparel = ['tees','hoodies','jackets','bottoms','kids'].includes(p.category);
  const swatchesHtml = isApparel ? `<div class="card-swatches" aria-hidden="true"><span class="swatch" style="background:#171717" title="Black"></span><span class="swatch" style="background:#f5f5f5;border:1px solid #d5d5d5" title="White"></span><span class="swatch" style="background:#9e9e9e" title="Heather Grey"></span><span class="swatch" style="background:#1b2a4a" title="Navy"></span><span class="swatch-more">+colors</span></div>` : '';
  const buyUrl = (p.url && !p.url.includes('urbanclothesmarket.com') && p.url.startsWith('http') && !p.url.includes('?q='))
    ? p.url
    : (p.path && !p.path.includes('urbanclothesmarket.com') && p.path.startsWith('http') && !p.path.includes('?q='))
      ? p.path
      : 'https://urbanclothesmarket.myspreadshop.com/';
  const pdpUrl = p.path || buyUrl;
  const priceVal = typeof p.price === 'number' ? p.price.toFixed(2) : (parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 24.99).toFixed(2);
  return `<article class="product-card" data-id="${esc(p.id)}"><div class="product-image"><a href="${esc(pdpUrl)}" aria-label="${esc(p.name)}"><img loading="lazy" decoding="async" width="400" height="400" src="${esc(p.image)}" alt="${esc(p.name)}"></a><button class="heart" data-save="${esc(p.id)}" aria-label="Save ${esc(p.name)}" aria-pressed="false">${icon('heart')}</button></div><div class="product-category">${esc(p.audience)}</div><h3><a class="product-link" href="${esc(pdpUrl)}">${esc(p.design || p.name)}</a></h3><div class="product-type">${esc(p.productType)}</div><div class="card-price-action"><div class="price">$${priceVal}</div><a class="btn-card-buy" href="${esc(buyUrl)}" target="_blank" rel="noopener">Buy Now ↗</a></div>${swatchesHtml}</article>`;
}

export function header(){
  return `<div class="announce-bar">
  <div class="wrap announce-inner">
    <span>⚡ 100,000+ Original Graphic Designs Across 15 Departments · <strong>Wear Your Personality</strong></span>
    <span class="announce-perks">Custom Made-to-Order · Official Merchandise</span>
  </div>
</div>
<header class="header walmart-header">
  <div class="wrap headrow walmart-headrow">
    <div class="head-left">
      <a class="logo" href="/" aria-label="Urban Clothes Market home">
        <span class="logo-mark">UCM</span>
        <span class="logo-text">URBAN CLOTHES<small>MARKET</small></span>
      </a>
      <div class="dept-dropdown" id="dept-dropdown">
        <button type="button" class="dept-btn" id="dept-btn" aria-expanded="false" aria-haspopup="true">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          <span>Departments</span>
          <span class="dept-arrow" aria-hidden="true">▾</span>
        </button>
        <div class="dept-menu" id="dept-menu" role="menu" style="display:none;position:absolute;top:calc(100% + 6px);left:0;z-index:9999;">
          <div class="dept-menu-inner">
            <div class="dept-col">
              <h5>Apparel</h5>
              <a href="/types/tees/">👕 Tees &amp; Tanks</a>
              <a href="/types/hoodies/">🧥 Hoodies &amp; Fleeces</a>
              <a href="/types/jackets/">🧥 Jackets &amp; Outerwear</a>
              <a href="/types/bottoms/">🩳 Shorts &amp; Joggers</a>
              <a href="/types/kids/">👶 Kids &amp; Baby</a>
            </div>
            <div class="dept-col">
              <h5>Home &amp; Tech</h5>
              <a href="/types/art/">🖼️ Wall Art &amp; Canvas</a>
              <a href="/types/mugs/">☕ Drinkware &amp; Mugs</a>
              <a href="/types/tech/">📱 Phone Cases &amp; Tech</a>
              <a href="/types/home/">🏠 Home &amp; Living</a>
              <a href="/types/stationery/">📓 Stationery &amp; Journals</a>
            </div>
            <div class="dept-col">
              <h5>Accessories &amp; Gear</h5>
              <a href="/types/stickers/">🏷️ Stickers, Pins &amp; Decals</a>
              <a href="/types/bags/">🎒 Bags &amp; Backpacks</a>
              <a href="/types/hats/">🧢 Hats &amp; Beanies</a>
              <a href="/types/pets/">🐾 Pet Gear</a>
              <a href="/types/accessories/">🔑 Accessories &amp; Keychains</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <form class="head-search walmart-search" action="/#catalog" method="GET" role="search">
      ${icon('search')}
      <input id="head-search-input" name="q" type="search" placeholder="Search 100,000+ items across 15 departments (cats, anime, cars, hoodies, mugs...)" aria-label="Search all 100,000+ items" autocomplete="off">
      <kbd class="kbd-hint" aria-hidden="true">/</kbd>
      <button type="submit" class="search-btn" aria-label="Search">${icon('search')} <span>Search</span></button>
      <div class="search-autocomplete" id="head-autocomplete" hidden></div>
    </form>

    <div class="head-actions walmart-actions">
      <button data-favorites class="action-btn" aria-label="View favorites" title="View Saved Items">
        ${icon('heart')}
        <span class="action-label">Saved</span>
        <span class="pill-count" data-favcount>0</span>
      </button>
      <button data-cart class="action-btn head-cart-btn" id="head-cart-trigger" aria-label="View shopping bag" title="View Shopping Bag">
        ${icon('bag')}
        <span class="action-label">Bag</span>
        <span class="pill-count" data-cartcount id="head-cart-count">0</span>
      </button>
    </div>
  </div>

  <nav class="subnav-strip" aria-label="Quick Departments Navigation">
    <div class="wrap subnav-inner">
      <a href="/#catalog" class="subnav-link highlight">⚡ Explore All</a>
      <a href="/types/hoodies/" class="subnav-link">🧥 Hoodies &amp; Fleeces</a>
      <a href="/types/jackets/" class="subnav-link">🧥 Jackets</a>
      <a href="/types/tees/" class="subnav-link">Tees &amp; Tanks</a>
      <a href="/types/hats/" class="subnav-link">Hats &amp; Beanies</a>
      <a href="/types/mugs/" class="subnav-link">Drinkware</a>
      <a href="/types/art/" class="subnav-link">Wall Art</a>
      <a href="/types/tech/" class="subnav-link">Phone Cases &amp; Tech</a>
      <a href="/types/home/" class="subnav-link">Home &amp; Living</a>
      <a href="/types/stickers/" class="subnav-link">Stickers &amp; Pins</a>
      <a href="/types/bags/" class="subnav-link">Bags &amp; Totes</a>
      <a href="/types/stationery/" class="subnav-link">Stationery</a>
      <a href="/types/kids/" class="subnav-link">Kids &amp; Baby</a>
      <a href="/types/bottoms/" class="subnav-link">Shorts &amp; Joggers</a>
      <a href="/types/pets/" class="subnav-link">Pet Gear</a>
      <a href="/types/accessories/" class="subnav-link">Accessories</a>
      <a href="/#collections" class="subnav-link theme-link">Themes ↗</a>
    </div>
  </nav>
</header>`;
}

export function footer(meta){
  return `<footer class="footer"><div class="wrap"><div class="foot-grid"><div><a class="logo" href="/"><span class="logo-mark">UCM</span><span class="logo-text">URBAN CLOTHES<small>MARKET</small></span></a><p>A massive collection of original graphic apparel, drinkware, and gifts for people with real passions. Designed with personality, printed when you order.</p></div><div><h4>Apparel</h4><ul><li><a href="/types/tees/">Tees &amp; Tanks (${(meta.typeCounts['tees']||0).toLocaleString()})</a></li><li><a href="/types/hoodies/">Hoodies &amp; Fleeces (${(meta.typeCounts['hoodies']||0).toLocaleString()})</a></li><li><a href="/types/jackets/">Jackets &amp; Outerwear (${(meta.typeCounts['jackets']||0).toLocaleString()})</a></li><li><a href="/types/bottoms/">Shorts &amp; Joggers (${(meta.typeCounts['bottoms']||0).toLocaleString()})</a></li><li><a href="/types/kids/">Kids &amp; Baby (${(meta.typeCounts['kids']||0).toLocaleString()})</a></li></ul></div><div><h4>Home, Art &amp; Tech</h4><ul><li><a href="/types/art/">Wall Art &amp; Canvas (${(meta.typeCounts['art']||0).toLocaleString()})</a></li><li><a href="/types/mugs/">Mugs &amp; Drinkware (${(meta.typeCounts['mugs']||0).toLocaleString()})</a></li><li><a href="/types/tech/">Phone Cases &amp; Tech (${(meta.typeCounts['tech']||0).toLocaleString()})</a></li><li><a href="/types/home/">Home &amp; Living (${(meta.typeCounts['home']||0).toLocaleString()})</a></li><li><a href="/types/stationery/">Stationery &amp; Journals (${(meta.typeCounts['stationery']||0).toLocaleString()})</a></li></ul></div><div><h4>Accessories &amp; Orders</h4><ul><li><a href="/types/stickers/">Stickers &amp; Pins (${(meta.typeCounts['stickers']||0).toLocaleString()})</a></li><li><a href="/types/bags/">Bags &amp; Backpacks (${(meta.typeCounts['bags']||0).toLocaleString()})</a></li><li><a href="/types/hats/">Hats &amp; Beanies (${(meta.typeCounts['hats']||0).toLocaleString()})</a></li><li><a href="/types/pets/">Pet Gear (${(meta.typeCounts['pets']||0).toLocaleString()})</a></li><li><a href="/types/accessories/">Accessories (${(meta.typeCounts['accessories']||0).toLocaleString()})</a></li><li><a href="/shipping/">Shipping &amp; delivery</a></li><li><a href="/returns/">Returns &amp; exchanges</a></li><li><a href="/privacy/">Privacy &amp; terms</a></li></ul></div></div><div class="foot-bottom"><span>© ${new Date().getFullYear()} Urban Clothes Market. Made to order. Delivered directly to your door.</span><span>${meta.count.toLocaleString()} listings · Catalog verified · Google Customer Reviews partner</span></div></div></footer>
<script src="https://apis.google.com/js/platform.js?onload=renderBadge" async defer></script>
<script>
  window.renderBadge = function() {
    var ratingBadgeContainer = document.createElement("div");
    document.body.appendChild(ratingBadgeContainer);
    window.gapi.load('ratingbadge', function() {
      window.gapi.ratingbadge.render(ratingBadgeContainer, {
        "merchant_id": 5871199587,
        "position": "BOTTOM_LEFT"
      });
    });
  }
</script>`;
}

export function shell({title,description,path='/',body,meta,structured,robots='index,follow'}){
  return `<!DOCTYPE HTML><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Urban Clothes Market</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${ORIGIN}${path}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${ORIGIN}${path}"><meta property="og:site_name" content="Urban Clothes Market"><meta property="og:image" content="${esc(meta.hero.image)}"><meta name="theme-color" content="#d5fa42"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css?v=20261013-winter-hoodies"><script type="module" src="/app.js?v=20261013-winter-hoodies"></script><script id="merchantWidgetScript" src="https://www.gstatic.com/shopping/merchant/merchantwidget.js" defer></script><script>window.addEventListener("load",function(){var el=document.getElementById("merchantWidgetScript");if(el){el.addEventListener("load",function(){if(window.merchantwidget&&window.merchantwidget.start){window.merchantwidget.start({merchant_id:5871199587,position:"BOTTOM_RIGHT",region:"US"});}});}});</script>${structured?'<script type="application/ld+json">'+JSON.stringify(structured).replace(/</g,'\\u003c')+'</script>':''}</head><body>${header()}<main>${body}</main>${footer(meta)}<div id="toast" class="toast" role="status" hidden></div><div class="recent-dock" id="recent-dock" hidden><button type="button" class="recent-trigger" id="recent-trigger" aria-expanded="false"><svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Recently Viewed</span> <span class="recent-badge" id="recent-count">0</span></button><div class="recent-drawer" id="recent-drawer" hidden><div class="recent-header"><span>RECENTLY VIEWED</span><button type="button" id="clear-recent" class="recent-clear-btn">Clear All</button></div><div class="recent-items" id="recent-items"></div></div></div><div class="cart-drawer-overlay" id="cart-drawer-overlay" hidden><div class="cart-drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Bag"><div class="cart-drawer-header"><h3>YOUR SHOPPING BAG (<span id="cart-item-count">0</span>)</h3><button type="button" class="cart-close-btn" id="cart-close-btn" aria-label="Close bag">×</button></div><div class="cart-drawer-items" id="cart-drawer-items"></div><div class="cart-drawer-footer" id="cart-drawer-footer"><div class="cart-subtotal-row"><span>Subtotal</span><strong id="cart-subtotal-val">$0.00</strong></div><button type="button" class="btn acid btn-checkout-cart" id="btn-checkout-cart">Proceed to Checkout →</button></div></div></div><div class="order-modal-overlay" id="order-modal-overlay" hidden><div class="order-modal" id="order-modal" role="dialog" aria-modal="true" aria-label="Instant Checkout"><div class="order-modal-header"><h3>INSTANT ORDER CHECKOUT</h3><button type="button" class="modal-close-btn" id="modal-close-btn" aria-label="Close checkout">×</button></div><div class="order-modal-body"><div class="order-item-summary"><img id="order-summary-img" src="" alt=""><div class="order-item-details"><h4 id="order-summary-title">Product</h4><p id="order-summary-specs">Size: M • Color: Black • Qty: 1</p><div class="order-summary-price" id="order-summary-price">$24.99</div></div></div><div class="express-pay-title">Express 1-Click Checkout</div><div class="express-buttons-grid"><button type="button" class="express-btn gpay" id="btn-gpay-express"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-9z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.2C3.3 21.4 7.3 24 12 24z"/><path fill="#FBBC05" d="M5.3 14.1c-.2-.7-.4-1.4-.4-2.1s.2-1.4.4-2.1V6.7H1.2C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l4.1-3.2z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.6 1.2 6.7l4.1 3.2c.9-2.9 3.6-5.1 6.7-5.1z"/></svg>Google Pay</button><button type="button" class="express-btn applepay" id="btn-apple-express"><svg viewBox="0 0 42 18" width="34" height="15"><path fill="#fff" d="M6.2 9.1c0-1.1.6-2.1 1.2-2.7-.6-.8-1.5-1.3-2.5-1.3-1.2 0-1.9.7-2.5.7-.7 0-1.5-.7-2.4-.7C-1.2 5.1-2.4 6.4-2.4 8.7c0 2.4 2.1 5.8 3.8 5.8.7 0 1.2-.5 2-.5.8 0 1.2.5 2 .5 1.4 0 2.4-1.5 3.2-2.7-.8-.4-1.4-1.3-1.4-2.7zm-1.4-5.2c.6-.7.9-1.6.8-2.6-.8 0-1.8.6-2.3 1.3-.5.6-.8 1.5-.7 2.4.9.1 1.6-.4 2.2-1.1z"/><text x="11" y="14" fill="#fff" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="700" font-size="13">Pay</text></svg></button><button type="button" class="express-btn paypal" id="btn-paypal-express"><span style="font-weight:900;font-style:italic">Pay</span><span style="color:#0079C1;font-weight:900;font-style:italic">Pal</span></button><button type="button" class="express-btn card" id="btn-card-toggle">Card</button></div><div class="express-pay-title">Or Direct Delivery Details</div><form class="order-form" id="order-checkout-form"><div class="order-form-group"><label for="order-email">Email Address</label><input type="email" id="order-email" required placeholder="you@example.com"></div><div class="order-form-group"><label for="order-name">Full Shipping Name</label><input type="text" id="order-name" required placeholder="Jane Doe"></div><div class="order-form-group"><label for="order-street">Shipping Street Address</label><input type="text" id="order-street" required placeholder="123 Main St, Apt 4B"></div><div class="order-form-row"><div class="order-form-group"><label for="order-city">City</label><input type="text" id="order-city" required placeholder="New York"></div><div class="order-form-group"><label for="order-state">State</label><input type="text" id="order-state" required placeholder="NY"></div><div class="order-form-group"><label for="order-zip">ZIP</label><input type="text" id="order-zip" required placeholder="10001"></div></div><button type="submit" class="btn acid btn-place-order" id="btn-submit-order">Confirm Order &amp; Review Guarantee →</button></form></div></div></div></body></html>`;
}

export function categoryChips(meta){
  return `<nav class="category-chips-nav" aria-label="Jump to product variation"><div class="category-chips-scroll">` +
    TYPES.map(([id, label]) => {
      const count = meta.typeCounts[id] || 0;
      return `<a class="chip" href="#type-${id}"><span class="chip-name">${esc(label)}</span><span class="chip-badge">${count.toLocaleString()}</span></a>`;
    }).join('') +
    THEMES.filter(([id]) => id !== 'all').map(([id, label]) => {
      const count = meta.themeCounts[id] || 0;
      return `<a class="chip theme-chip" href="#theme-${id}"><span class="chip-name">${esc(label)}</span><span class="chip-badge">${count.toLocaleString()}</span></a>`;
    }).join('') +
  `</div></nav>`;
}

export function discoveryBar({ id, title, subtitle, placeholder = "Search 100,000+ items across all variations..." }){
  return `<section class="discovery-bar wrap" id="${esc(id)}">
    <div class="discovery-content">
      <div class="discovery-text">
        <span class="eyebrow">INSTANT INVENTORY SEARCH</span>
        <h3>${esc(title)}</h3>
        <p>${esc(subtitle)}</p>
      </div>
      <form class="discovery-search-form" action="/#catalog" method="GET" role="search">
        ${icon('search')}
        <input name="q" type="search" placeholder="${esc(placeholder)}" aria-label="${esc(title)}" autocomplete="off">
        <button type="submit" class="btn acid">Search</button>
        <button type="button" class="btn dark" data-surprise aria-label="Surprise me with random picks">${icon('shuffle')} Surprise Me</button>
        <div class="search-autocomplete" hidden></div>
      </form>
    </div>
  </section>`;
}

export function showcaseRow({ id, title, subtitle, count, link, isType = true, products = [] }){
  const subfilters = isType ? [
    { id: 'all', label: 'All' },
    { id: 'love', label: 'Love' },
    { id: 'gothic', label: 'Gothic' },
    { id: 'sports', label: 'Sports' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'inspirational', label: 'Inspirational' },
    { id: 'gamers', label: 'Gaming' },
    { id: 'cats', label: 'Cats' },
    { id: 'dogs', label: 'Dogs' },
    { id: 'cars', label: 'Cars' },
    { id: 'humor', label: 'Humor' },
    { id: 'streetwear', label: 'Streetwear' },
    { id: 'cyber', label: 'Sci-Fi' },
    { id: 'tarot', label: 'Tarot' }
  ] : [];

  const subfilterHtml = subfilters.length ? `<div class="row-subfilters" role="group" aria-label="Sub-filters for ${esc(title)}">` +
    subfilters.map(sf => `<button type="button" class="subfilter-chip ${sf.id==='all'?'active':''}" data-row-subfilter="${sf.id}" data-target-type="${esc(id)}">${sf.label}</button>`).join('') +
  `</div>` : '';

  const endCardHtml = `<article class="product-card end-card-showcase"><a href="${esc(link)}" class="end-card-link"><div class="end-card-badge">⚡ COUNTLESS DESIGNS</div><div class="end-card-count">+${(count > 10 ? count - 10 : count).toLocaleString()}</div><h3>More ${esc(title.split('&')[0].trim())}</h3><p>Discover thousands of original graphics, colors &amp; custom fits in this full department.</p><span class="btn-end-explore">See Entire Collection (${count.toLocaleString()}+) ↗</span></a></article>`;

  return `<section class="showcase-row" id="${isType ? 'type-' + id : 'theme-' + id}">
    <div class="section-head">
      <div class="section-title-wrap">
        <div class="sub">${isType ? 'PRODUCT TYPE VARIATION' : 'CURATED PASSION THEME'}</div>
        <div class="title-row-flex">
          <h2>${esc(title)} <span class="count-pill">${count.toLocaleString()} items</span></h2>
          <a class="btn-see-all-pill" href="${esc(link)}">
            <span>See All ${count.toLocaleString()}+ Items</span>
            <span class="see-all-arrow">↗</span>
          </a>
        </div>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
      </div>
      <div class="row-actions">
        <div class="scroll-arrows">
          <button class="scroll-arrow" data-scroll-dir="prev" aria-label="Scroll left in ${esc(title)}">←</button>
          <button class="scroll-arrow" data-scroll-dir="next" aria-label="Scroll right in ${esc(title)}">→</button>
        </div>
        <button class="shuffle" data-row-shuffle="${esc(id)}" data-is-type="${isType}">
          ${icon('shuffle')} Shuffle ${esc(title.split(' ')[0])}
        </button>
        <a class="btn-see-all-action" href="${esc(link)}">Explore All ${count.toLocaleString()} ↗</a>
      </div>
    </div>
    ${subfilterHtml}
    <div class="scroll-track" data-track="${esc(id)}" ${isType ? `data-row-type="${esc(id)}"` : `data-row="${esc(id)}"`} data-row-title="${esc(title)}" data-row-count="${count}" data-row-link="${esc(link)}">
      ${products.slice(0, 10).map(card).join('')}
      ${endCardHtml}
    </div>
  </section>`;
}

export function themeTiles(meta){
  const featuredThemes = ['love', 'gothic', 'sports', 'relationships', 'inspirational', 'gamers', 'cats', 'dogs', 'cars', 'humor', 'streetwear', 'tarot'];
  return `<div class="themes-grid">${featuredThemes.map(id => {
    let t = THEMES.find(x => x[0] === id);
    if (!t) return '';
    let p = meta.themeHero[id] || meta.hero;
    return `<a class="theme-tile" href="/collections/${id}/">${p ? `<img src="${esc(p.image)}" alt="${esc(t[1])} designs" loading="lazy">` : ''}<h3>${t[1]}</h3><small>${(meta.themeCounts[id] || 0).toLocaleString()} items to discover</small><span class="arrow">↗</span></a>`;
  }).join('')}</div>`;
}

export function filters(meta,{type='',theme='',q=''}={}){
  return `<form class="searchbar" role="search"><label class="sr-only" for="search" style="position:absolute;clip:rect(0,0,0,0)">Search all products</label>${icon('search')}<input id="search" name="q" type="search" placeholder="Search a design, passion, or product type across all 100,000+ items…" value="${esc(q)}" autocomplete="off"><kbd class="kbd-hint" aria-hidden="true">/</kbd><button type="submit">Search</button><div class="search-autocomplete" id="catalog-autocomplete" hidden></div></form><div class="catalog-layout"><aside class="filters walmart-sidebar" id="filters" aria-label="Product Filters"><div class="sidebar-header"><div class="sidebar-title-row"><div class="sidebar-heading"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>All Departments &amp; Filters</span></div><button type="button" class="btn-sidebar-reset" data-clear aria-label="Reset all filters">Reset All</button></div><div class="sidebar-sub">${meta.count.toLocaleString()} Total Items Available</div></div><details open class="filter-accordion" id="accordion-departments"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">📦</span><span>Departments &amp; Products</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="department-list" role="list"><a href="/#catalog" class="dept-link ${!type?'active':''}" data-type=""><span class="dept-link-label">⚡ All Products / Variations</span><span class="dept-link-count">${meta.count.toLocaleString()}</span></a>${TYPES.map(([id,name])=>{const icons={tees:'👕',hoodies:'🧥',jackets:'🧥',hats:'🧢',mugs:'☕',art:'🖼️',tech:'📱',home:'🏠',stickers:'🏷️',bags:'🎒',stationery:'📓',kids:'👶',bottoms:'🩳',pets:'🐾',accessories:'🔑'};return `<a href="/types/${id}/" class="dept-link ${id===type?'active':''}" data-type="${id}"><span class="dept-link-label">${icons[id]||'🏷️'} ${esc(name)}</span><span class="dept-link-count">${(meta.typeCounts[id]||0).toLocaleString()}</span></a>`;}).join('')}</div></div></details><details open class="filter-accordion" id="accordion-sizes"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">📏</span><span>Sizes</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="size-grid" role="group" aria-label="Filter by size">${['XS','S','M','L','XL','2XL','3XL','4XL','5XL','One Size'].map(s=>`<button type="button" class="size-pill" data-size="${esc(s)}" aria-label="Size ${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="size-guide-tip">Includes unisex streetwear, relaxed fit hoodies &amp; standard sizing.</div></div></details><details open class="filter-accordion" id="accordion-itemtypes"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">🏷️</span><span>Item Type &amp; Variation</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="item-type-list">${[{id:'',label:'All Item Types'},{id:'T-Shirt',label:'Classic Streetwear T-Shirts'},{id:'Hoodie',label:'Heavyweight Pullover Hoodies'},{id:'Sweatshirt',label:'Crewneck Fleeces & Sweaters'},{id:'Jacket',label:'Windbreakers & Light Jackets'},{id:'Tank',label:'Athletic Tanks & Sleeveless'},{id:'Mug',label:'Ceramic Mugs (11oz & 15oz)'},{id:'Tumbler',label:'Stainless Travel Drinkware'},{id:'Sticker',label:'Die-Cut Matte Vinyl Stickers'},{id:'Poster',label:'Archival Art Posters & Prints'},{id:'Canvas',label:'Gallery Canvas Wraps'},{id:'Phone Case',label:'Shockproof Smartphone Cases'},{id:'Desk Mat',label:'Extended Gaming Desk Pads'},{id:'Pillow',label:'Square Linen Throw Pillows'},{id:'Blanket',label:'Cozy Sherpa & Fleece Blankets'},{id:'Tote',label:'Heavy Duty Canvas Totes'},{id:'Journal',label:'Hardcover Ruled Notebooks'},{id:'Hat',label:'Snapback & Trucker Caps'},{id:'Beanie',label:'Knit Winter Beanies'},{id:'Jogger',label:'Cotton Fleece Joggers'},{id:'Bandana',label:'Pet Bandanas & Accessories'}].map(item=>`<button type="button" class="item-type-chip" data-item-type="${esc(item.id)}"><span class="item-type-text">${esc(item.label)}</span></button>`).join('')}</div></div></details><details open class="filter-accordion" id="accordion-themes"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">🎨</span><span>Passion Themes</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="theme-filter-list"><button type="button" class="theme-filter-btn ${!theme?'active':''}" data-theme=""><span>All Passion Themes</span><small>${meta.count.toLocaleString()}</small></button>${THEMES.filter(([id])=>id!=='all').map(([id,name])=>{const icons={cats:'🐱',dogs:'🐶',cars:'🚗',gamers:'🎮',gothic:'🖤',streetwear:'🛹',humor:'😂',love:'💖',cyber:'⚡',tarot:'🔮',sports:'🏋️',inspirational:'✨',diy:'🛠️',relationships:'👥',fantasy:'🐉',kids:'👶'};return `<button type="button" class="theme-filter-btn ${theme===id?'active':''}" data-theme="${id}"><span>${icons[id]||'✨'} ${esc(name)}</span><small>${(meta.themeCounts[id]||0).toLocaleString()}</small></button>`;}).join('')}</div></div></details><details class="filter-accordion" id="accordion-audience"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">👥</span><span>Audience &amp; Gender</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="audience-options">${[{id:'',label:'All Audiences'},{id:'Unisex & Everyone',label:'Unisex & Everyone'},{id:'Men',label:"Men's Apparel"},{id:'Women',label:"Women's Apparel"},{id:'Kids & Babies',label:'Kids & Baby'}].map(a=>`<button type="button" class="audience-option-btn" data-audience="${esc(a.id)}"><span>${esc(a.label)}</span></button>`).join('')}</div></div></details><details open class="filter-accordion" id="accordion-price"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">💲</span><span>Price Range</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="price-options"><button type="button" class="price-btn active" data-budget="0">Any Price</button><button type="button" class="price-btn" data-budget="15">Under $15 <small>(Stickers, small gifts)</small></button><button type="button" class="price-btn" data-budget="25">Under $25 <small>(Tees, mugs, journals)</small></button><button type="button" class="price-btn" data-budget="40">Under $40 <small>(Totes, pillows, art)</small></button><button type="button" class="price-btn" data-budget="60">Under $60 <small>(Hoodies, jackets)</small></button></div></div></details><details class="filter-accordion" id="accordion-brand"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">🏷️</span><span>Garment Brand</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="brand-options"><button type="button" class="brand-option-btn active" data-brand="">All Brands</button>${['Champion','Stanley/Stella','Bella + Canvas','Gildan','Under Armour','Adidas','Augusta Sportswear','Bayside','Flexfit'].map(b=>`<button type="button" class="brand-option-btn" data-brand="${esc(b)}">${esc(b)}</button>`).join('')}</div></div></details><div class="sidebar-trust-box"><div class="trust-item"><strong>✨ Made to Order</strong><p>Printed with premium inks when you choose your fit &amp; size.</p></div><div class="trust-item"><strong>⚡ Instant Discovery</strong><p>Shuffle anytime to browse hundreds of thousands of combinations.</p></div></div></aside><div><div class="results-top"><span id="result-count" role="status">${meta.count.toLocaleString()} matching items. Endless personality.</span><div class="actions"><button class="mobile-filter" type="button" data-toggle-filters aria-expanded="false" aria-controls="filters">Filters +</button><button class="btn-share-wishlist" data-share-wishlist type="button" title="Copy shareable link to your favorites"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Share Wishlist</button><select id="sort" aria-label="Sort products"><option value="shuffle">Random discovery</option><option value="newest">Catalog order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="az">Name: A to Z</option></select><button class="shuffle" data-shuffle type="button">${icon('shuffle')} Shuffle All</button></div></div><div class="active-tags" id="active-tags"></div><div class="grid" id="results">__CARDS__</div><div class="pagination"><button type="button" id="prev">← Previous</button><span id="page-count">Page 1</span><button type="button" id="next">Next →</button></div><p style="text-align:center;font-size:10px;color:var(--muted)">All prices in USD. Choose your color and size on the product page.</p></div></div>`;
}

