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
    <span>⚡ <strong>18,622+ Official Graphic Hoodies, Tees, Hats &amp; Merch Listings</strong> Across 5 Partner Stores · Made to Order</span>
    <span class="announce-perks"><a href="/#catalog" style="color:var(--acid);text-decoration:underline;margin-right:10px">🧥 Shop Apparel</a> · <a href="/#collections" style="color:#fff;text-decoration:underline;margin-right:10px">🎨 Passion Themes</a> · <a href="#amazon-books" style="color:#fff;text-decoration:underline">📚 Author Books ↓</a></span>
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
              <h5>Accessories &amp; More</h5>
              <a href="/types/stickers/">🏷️ Stickers, Pins &amp; Decals</a>
              <a href="/types/bags/">🎒 Bags &amp; Backpacks</a>
              <a href="/types/hats/">🧢 Hats &amp; Beanies</a>
              <a href="/types/pets/">🐾 Pet Gear</a>
              <a href="/types/accessories/">🔑 Accessories &amp; Keychains</a>
              <a href="/guides/" style="color:var(--acid);font-weight:800;">🎁 Buyer's Gift Guides (15)</a>
              <a href="/books/" style="color:var(--acid);font-weight:800;">📚 Published Books on Amazon (18)</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <form class="head-search walmart-search" action="/#catalog" method="GET" role="search">
      ${icon('search')}
      <input id="head-search-input" name="q" type="search" placeholder="Search 18,622+ graphic hoodies, tees, hats, mugs, stickers &amp; gifts (cats, cyberpunk, cars, gaming...)" aria-label="Search all items" autocomplete="off">
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
      <a href="/guides/" class="action-btn" title="Curated Buyer's Gift Guides">
        <span class="action-label">🎁 Guides</span>
      </a>
      <a href="/books/" class="action-btn" title="Official Published Books on Amazon">
        <span class="action-label">📚 Books (18)</span>
      </a>
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
      <a href="/guides/" class="subnav-link">🎁 Gift Guides (15)</a>
      <a href="#amazon-books" class="subnav-link">📚 Books (18)</a>
    </div>
  </nav>
</header>`;
}

export function footer(meta){
  return `<footer class="footer"><div class="wrap"><div class="foot-grid"><div><a class="logo" href="/"><span class="logo-mark">UCM</span><span class="logo-text">URBAN CLOTHES<small>MARKET</small></span></a><p>A massive collection of 18,622+ original graphic apparel, drinkware, and gifts across 5 official partner stores—plus 18 published Amazon KDP books by author Jason Coleman (with 2 new books released weekly).</p><p style="margin-top:10px"><a href="/books/" style="color:var(--acid);font-weight:700;text-decoration:underline">📚 Browse All 18 Amazon Books →</a><br><a href="/guides/" style="color:#fff;font-weight:700;text-decoration:underline">🎁 Explore 15 Niche Buyer's Gift Guides →</a></p></div><div><h4>Apparel &amp; Books</h4><ul><li><a href="/books/" style="color:var(--acid);font-weight:700">📚 Published Books on Amazon (18)</a></li><li><a href="/guides/" style="color:var(--acid);font-weight:700">🎁 Buyer's Gift Guides (15)</a></li><li><a href="https://www.amazon.com/stores/Jason-Coleman/author/B0HHYS2BHM/allbooks" target="_blank" rel="noopener">Amazon Author Central (Jason Coleman) ↗</a></li><li><a href="/types/tees/">Tees &amp; Tanks (${(meta.typeCounts['tees']||0).toLocaleString()})</a></li><li><a href="/types/hoodies/">Hoodies &amp; Fleeces (${(meta.typeCounts['hoodies']||0).toLocaleString()})</a></li><li><a href="/types/jackets/">Jackets &amp; Outerwear (${(meta.typeCounts['jackets']||0).toLocaleString()})</a></li><li><a href="/types/bottoms/">Shorts &amp; Joggers (${(meta.typeCounts['bottoms']||0).toLocaleString()})</a></li><li><a href="/types/kids/">Kids &amp; Baby (${(meta.typeCounts['kids']||0).toLocaleString()})</a></li></ul></div><div><h4>Home, Art &amp; Tech</h4><ul><li><a href="/types/art/">Wall Art &amp; Canvas (${(meta.typeCounts['art']||0).toLocaleString()})</a></li><li><a href="/types/mugs/">Mugs &amp; Drinkware (${(meta.typeCounts['mugs']||0).toLocaleString()})</a></li><li><a href="/types/tech/">Phone Cases &amp; Tech (${(meta.typeCounts['tech']||0).toLocaleString()})</a></li><li><a href="/types/home/">Home &amp; Living (${(meta.typeCounts['home']||0).toLocaleString()})</a></li><li><a href="/types/stationery/">Stationery &amp; Journals (${(meta.typeCounts['stationery']||0).toLocaleString()})</a></li></ul></div><div><h4>Accessories &amp; Orders</h4><ul><li><a href="/types/stickers/">Stickers &amp; Pins (${(meta.typeCounts['stickers']||0).toLocaleString()})</a></li><li><a href="/types/bags/">Bags &amp; Backpacks (${(meta.typeCounts['bags']||0).toLocaleString()})</a></li><li><a href="/types/hats/">Hats &amp; Beanies (${(meta.typeCounts['hats']||0).toLocaleString()})</a></li><li><a href="/types/pets/">Pet Gear (${(meta.typeCounts['pets']||0).toLocaleString()})</a></li><li><a href="/types/accessories/">Accessories (${(meta.typeCounts['accessories']||0).toLocaleString()})</a></li><li><a href="/shipping/">Shipping &amp; delivery</a></li><li><a href="/returns/">Returns &amp; exchanges</a></li><li><a href="/privacy/">Privacy &amp; terms</a></li></ul></div></div><div class="foot-bottom"><span>© ${new Date().getFullYear()} Urban Clothes Market &amp; Jason Coleman Publishing. Made to order. Delivered directly to your door.</span><span>${meta.count.toLocaleString()} merch listings · 18 Amazon KDP Books · Google Customer Reviews partner</span></div></div></footer>
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

export function shell({title,description,path='/',body,meta,structured,robots='index,follow',ogImage=''}){
  const shareImg = ogImage || (meta && meta.hero && meta.hero.image) || 'https://m.media-amazon.com/images/I/81JCH1wM8sL._SL1000_.jpg';
  return `<!DOCTYPE HTML><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Urban Clothes Market</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${ORIGIN}${path}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${ORIGIN}${path}"><meta property="og:site_name" content="Urban Clothes Market"><meta property="og:image" content="${esc(shareImg)}"><meta name="theme-color" content="#d5fa42"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css?v=20261028-direct-v3"><script type="module" src="/app.js?v=20261028-direct-v3"></script><script id="merchantWidgetScript" src="https://www.gstatic.com/shopping/merchant/merchantwidget.js" defer></script><script>window.addEventListener("load",function(){var el=document.getElementById("merchantWidgetScript");if(el){el.addEventListener("load",function(){if(window.merchantwidget&&window.merchantwidget.start){window.merchantwidget.start({merchant_id:5871199587,position:"BOTTOM_RIGHT",region:"US"});}});}});</script>${structured?'<script type="application/ld+json">'+JSON.stringify(structured).replace(/</g,'\\u003c')+'</script>':''}</head><body>${header()}<main>${body}</main>${footer(meta)}<div id="toast" class="toast" role="status" hidden></div><div class="recent-dock" id="recent-dock" hidden><button type="button" class="recent-trigger" id="recent-trigger" aria-expanded="false"><svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Recently Viewed</span> <span class="recent-badge" id="recent-count">0</span></button><div class="recent-drawer" id="recent-drawer" hidden><div class="recent-header"><span>RECENTLY VIEWED</span><button type="button" id="clear-recent" class="recent-clear-btn">Clear All</button></div><div class="recent-items" id="recent-items"></div></div></div></body></html>`;
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
  return `<form class="searchbar" role="search"><label class="sr-only" for="search" style="position:absolute;clip:rect(0,0,0,0)">Search all products</label>${icon('search')}<input id="search" name="q" type="search" placeholder="Search a design, passion, or product type across all 100,000+ items…" value="${esc(q)}" autocomplete="off"><kbd class="kbd-hint" aria-hidden="true">/</kbd><button type="submit">Search</button><div class="search-autocomplete" id="catalog-autocomplete" hidden></div></form><div class="catalog-layout"><aside class="filters walmart-sidebar" id="filters" aria-label="Product Filters"><div class="sidebar-header"><div class="sidebar-title-row"><div class="sidebar-heading"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>All Departments &amp; Filters</span></div><button type="button" class="btn-sidebar-reset" data-clear aria-label="Reset all filters">Reset All</button></div><div class="sidebar-sub">${meta.count.toLocaleString()} Total Items Available</div></div><details open class="filter-accordion" id="accordion-departments"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">📦</span><span>Departments &amp; Products</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="department-list" role="list"><a href="/#catalog" class="dept-link ${!type?'active':''}" data-type=""><span class="dept-link-label">⚡ All Products / Variations</span><span class="dept-link-count">${meta.count.toLocaleString()}</span></a>${TYPES.map(([id,name])=>{const icons={tees:'👕',hoodies:'🧥',jackets:'🧥',hats:'🧢',mugs:'☕',art:'🖼️',tech:'📱',home:'🏠',stickers:'🏷️',bags:'🎒',stationery:'📓',kids:'👶',bottoms:'🩳',pets:'🐾',accessories:'🔑'};return `<a href="/types/${id}/" class="dept-link ${id===type?'active':''}" data-type="${id}"><span class="dept-link-label">${icons[id]||'🏷️'} ${esc(name)}</span><span class="dept-link-count">${(meta.typeCounts[id]||0).toLocaleString()}</span></a>`;}).join('')}<a href="/guides/" class="dept-link"><span class="dept-link-label">🎁 Buyer's Gift Guides</span><span class="dept-link-count">15</span></a><a href="/books/" class="dept-link"><span class="dept-link-label">📚 Published Books on Amazon</span><span class="dept-link-count">18</span></a></div></div></details><details open class="filter-accordion" id="accordion-sizes"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">📏</span><span>Sizes</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="size-grid" role="group" aria-label="Filter by size">${['XS','S','M','L','XL','2XL','3XL','4XL','5XL','One Size'].map(s=>`<button type="button" class="size-pill" data-size="${esc(s)}" aria-label="Size ${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="size-guide-tip">Includes unisex streetwear, relaxed fit hoodies &amp; standard sizing.</div></div></details><details open class="filter-accordion" id="accordion-itemtypes"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">🏷️</span><span>Item Type &amp; Variation</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="item-type-list">${[{id:'',label:'All Item Types'},{id:'T-Shirt',label:'Classic Streetwear T-Shirts'},{id:'Hoodie',label:'Heavyweight Pullover Hoodies'},{id:'Sweatshirt',label:'Crewneck Fleeces & Sweaters'},{id:'Jacket',label:'Windbreakers & Light Jackets'},{id:'Tank',label:'Athletic Tanks & Sleeveless'},{id:'Mug',label:'Ceramic Mugs (11oz & 15oz)'},{id:'Tumbler',label:'Stainless Travel Drinkware'},{id:'Sticker',label:'Die-Cut Matte Vinyl Stickers'},{id:'Poster',label:'Archival Art Posters & Prints'},{id:'Canvas',label:'Gallery Canvas Wraps'},{id:'Phone Case',label:'Shockproof Smartphone Cases'},{id:'Desk Mat',label:'Extended Gaming Desk Pads'},{id:'Pillow',label:'Square Linen Throw Pillows'},{id:'Blanket',label:'Cozy Sherpa & Fleece Blankets'},{id:'Tote',label:'Heavy Duty Canvas Totes'},{id:'Journal',label:'Hardcover Ruled Notebooks'},{id:'Hat',label:'Snapback & Trucker Caps'},{id:'Beanie',label:'Knit Winter Beanies'},{id:'Jogger',label:'Cotton Fleece Joggers'},{id:'Bandana',label:'Pet Bandanas & Accessories'}].map(item=>`<button type="button" class="item-type-chip" data-item-type="${esc(item.id)}"><span class="item-type-text">${esc(item.label)}</span></button>`).join('')}</div></div></details><details open class="filter-accordion" id="accordion-themes"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">🎨</span><span>Passion Themes</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="theme-filter-list"><button type="button" class="theme-filter-btn ${!theme?'active':''}" data-theme=""><span>All Passion Themes</span><small>${meta.count.toLocaleString()}</small></button>${THEMES.filter(([id])=>id!=='all').map(([id,name])=>{const icons={cats:'🐱',dogs:'🐶',cars:'🚗',gamers:'🎮',gothic:'🖤',streetwear:'🛹',humor:'😂',love:'💖',cyber:'⚡',tarot:'🔮',sports:'🏋️',inspirational:'✨',diy:'🛠️',relationships:'👥',fantasy:'🐉',kids:'👶'};return `<button type="button" class="theme-filter-btn ${theme===id?'active':''}" data-theme="${id}"><span>${icons[id]||'✨'} ${esc(name)}</span><small>${(meta.themeCounts[id]||0).toLocaleString()}</small></button>`;}).join('')}</div></div></details><details class="filter-accordion" id="accordion-audience"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">👥</span><span>Audience &amp; Gender</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="audience-options">${[{id:'',label:'All Audiences'},{id:'Unisex & Everyone',label:'Unisex & Everyone'},{id:'Men',label:"Men's Apparel"},{id:'Women',label:"Women's Apparel"},{id:'Kids & Babies',label:'Kids & Baby'}].map(a=>`<button type="button" class="audience-option-btn" data-audience="${esc(a.id)}"><span>${esc(a.label)}</span></button>`).join('')}</div></div></details><details open class="filter-accordion" id="accordion-price"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">💲</span><span>Price Range</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="price-options"><button type="button" class="price-btn active" data-budget="0">Any Price</button><button type="button" class="price-btn" data-budget="15">Under $15 <small>(Stickers, small gifts)</small></button><button type="button" class="price-btn" data-budget="25">Under $25 <small>(Tees, mugs, journals)</small></button><button type="button" class="price-btn" data-budget="40">Under $40 <small>(Totes, pillows, art)</small></button><button type="button" class="price-btn" data-budget="60">Under $60 <small>(Hoodies, jackets)</small></button></div></div></details><details open class="filter-accordion" id="accordion-brand"><summary class="accordion-summary"><span class="accordion-title"><span class="accordion-icon">🏪</span><span>Storefront &amp; Brand</span></span><span class="accordion-chevron" aria-hidden="true">▾</span></summary><div class="accordion-content"><div class="brand-options"><button type="button" class="brand-option-btn active" data-brand="">All Storefronts &amp; Brands</button>${['Spreadshop','Printify','Zazzle','Redbubble','TeePublic','Champion','Stanley/Stella','Bella + Canvas','Gildan','Under Armour','Adidas','Augusta Sportswear','Bayside','Flexfit'].map(b=>`<button type="button" class="brand-option-btn" data-brand="${esc(b)}">${esc(b)}</button>`).join('')}</div></div></details><div class="sidebar-trust-box"><div class="trust-item"><strong>✨ Made to Order</strong><p>Printed with premium inks when you choose your fit &amp; size.</p></div><div class="trust-item"><strong>⚡ Instant Discovery</strong><p>Shuffle anytime to browse hundreds of thousands of combinations.</p></div></div></aside><div><div class="results-top"><span id="result-count" role="status">${meta.count.toLocaleString()} matching items. Endless personality.</span><div class="actions"><button class="mobile-filter" type="button" data-toggle-filters aria-expanded="false" aria-controls="filters">Filters +</button><button class="btn-share-wishlist" data-share-wishlist type="button" title="Copy shareable link to your favorites"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Share Wishlist</button><select id="sort" aria-label="Sort products"><option value="shuffle">Random discovery</option><option value="newest">Catalog order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="az">Name: A to Z</option></select><button class="shuffle" data-shuffle type="button">${icon('shuffle')} Shuffle All</button></div></div><div class="active-tags" id="active-tags"></div><div class="grid" id="results">__CARDS__</div><div class="pagination"><button type="button" id="prev">← Previous</button><span id="page-count">Page 1</span><button type="button" id="next">Next →</button></div><p style="text-align:center;font-size:10px;color:var(--muted)">All prices in USD. Choose your color and size on the product page.</p></div></div>`;
}

export const AMAZON_AUTHOR_URL = 'https://www.amazon.com/stores/Jason-Coleman/author/B0HHYS2BHM/allbooks';

export function bookFormatButtonsHtml(book, compact = false) {
  const btns = [];
  const primary = book.kindleAsin || book.primaryAsin;
  if (book.kindleAsin) {
    btns.push(`<a class="btn-book-amz" href="https://www.amazon.com/dp/${esc(book.kindleAsin)}" target="_blank" rel="noopener">📱 Kindle${book.kindleUnlimited ? ' / KU' : ''} ($${esc(book.price)}) ↗</a>`);
  } else if (primary) {
    btns.push(`<a class="btn-book-amz" href="https://www.amazon.com/dp/${esc(primary)}" target="_blank" rel="noopener">📦 Buy on Amazon ($${esc(book.price)}) ↗</a>`);
  }
  if (book.paperbackAsin && book.paperbackAsin !== book.kindleAsin) {
    btns.push(`<a class="btn-book-amz secondary" href="https://www.amazon.com/dp/${esc(book.paperbackAsin)}" target="_blank" rel="noopener">📖 Paperback${book.paperbackPrice ? ' ($' + esc(book.paperbackPrice) + ')' : ''} ↗</a>`);
  }
  if (book.hardcoverAsin) {
    btns.push(`<a class="btn-book-amz secondary" href="https://www.amazon.com/dp/${esc(book.hardcoverAsin)}" target="_blank" rel="noopener">📕 Hardcover${book.hardcoverPrice ? ' ($' + esc(book.hardcoverPrice) + ')' : ''} ↗</a>`);
  }
  if (book.audiobookAsin) {
    btns.push(`<a class="btn-book-amz secondary" href="https://www.amazon.com/dp/${esc(book.audiobookAsin)}" target="_blank" rel="noopener">🎧 Audible Audiobook ↗</a>`);
  }
  if (!compact) {
    btns.push(`<a class="btn-book-details" href="/books/${esc(book.slug)}/">Book Details &amp; Matching Merch →</a>`);
  }
  return `<div class="book-format-btns">${btns.join('')}</div>`;
}

export function bookCardHtml(book) {
  const primaryAsin = book.primaryAsin || book.kindleAsin || book.paperbackAsin;
  const amzUrl = `https://www.amazon.com/dp/${esc(primaryAsin)}`;
  const formatLinks = [];
  if (book.kindleAsin) formatLinks.push(`<a href="https://www.amazon.com/dp/${esc(book.kindleAsin)}" target="_blank" rel="noopener">Kindle${book.kindleUnlimited ? '/KU' : ''}</a>`);
  if (book.paperbackAsin) formatLinks.push(`<a href="https://www.amazon.com/dp/${esc(book.paperbackAsin)}" target="_blank" rel="noopener">Paperback</a>`);
  if (book.hardcoverAsin) formatLinks.push(`<a href="https://www.amazon.com/dp/${esc(book.hardcoverAsin)}" target="_blank" rel="noopener">Hardcover</a>`);
  if (book.audiobookAsin) formatLinks.push(`<a href="https://www.amazon.com/dp/${esc(book.audiobookAsin)}" target="_blank" rel="noopener">Audible</a>`);

  return `<article class="book-card" data-asin="${esc(primaryAsin)}">
    <div>
      <a class="book-card-cover" href="/books/${esc(book.slug)}/" aria-label="${esc(book.title)}">
        <img src="${esc(book.cover)}" alt="${esc(book.title)} by Jason Coleman book cover" width="300" height="450" loading="lazy" decoding="async">
      </a>
      <span class="book-card-badge">${esc(book.badge || 'Live on Amazon')}</span>
      <h3><a href="/books/${esc(book.slug)}/">${esc(book.title)}</a></h3>
      <div class="book-card-genre">${esc(book.genre)}</div>
      <div class="book-card-price">From $${esc(book.price)}${book.kindleUnlimited ? ' · <span style="color:#ffb84d">Free in Kindle Unlimited</span>' : ''}</div>
    </div>
    <div class="book-card-actions">
      <a class="btn-book-amz" href="${amzUrl}" target="_blank" rel="noopener">Buy on Amazon ↗</a>
      <div class="book-card-format-links">${formatLinks.join('')}</div>
      <a class="book-card-seo-link" href="/books/${esc(book.slug)}/">Explore Book + Merch →</a>
    </div>
  </article>`;
}

export function booksShowcaseSection(booksData, { includePipeline = false } = {}) {
  const books = booksData?.books || [];
  const newestTwo = books.slice(0, 2);
  const pipelineHtml = includePipeline && Array.isArray(booksData?.upcomingPipeline) ? `
    <div class="kdp-pipeline-box" id="upcoming-kdp-pipeline" style="color:var(--ink)">
      <div class="eyebrow" style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#475569">WEEKLY KDP RELEASE SCHEDULE · 2 NEW BOOKS PUBLISHED EVERY WEEK</div>
      <h3 style="font:900 32px/1.05 var(--display);text-transform:uppercase;margin:6px 0 8px">Upcoming KDP Release Queue (${booksData.upcomingPipeline.length} Scheduled Titles)</h3>
      <p style="font-size:13px;color:var(--muted);margin:0">Follow <a href="${AMAZON_AUTHOR_URL}" target="_blank" rel="noopener" style="text-decoration:underline;font-weight:700;color:var(--ink)">Jason Coleman on Amazon Author Central ↗</a> to get notified the moment each new weekly release goes live.</p>
      <div class="kdp-pipeline-grid">
        ${booksData.upcomingPipeline.map(item => `
          <div class="kdp-pipeline-card">
            <span class="kdp-pipeline-status">${esc(item.status)}</span>
            <h4 style="margin-top:8px">${esc(item.title)}</h4>
            <p>${esc(item.genre)}</p>
            <a href="${AMAZON_AUTHOR_URL}" target="_blank" rel="noopener" style="font-size:11px;font-weight:800;text-decoration:underline;color:var(--ink)">Follow Author on Amazon ↗</a>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `<section class="books-showcase-section" id="amazon-books">
    <div class="books-showcase-header">
      <div>
        <span class="books-eyebrow">📚 OFFICIAL AUTHOR STOREFRONT · JASON COLEMAN (ASIN B0HHYS2BHM)</span>
        <h2>Official Published Books on Amazon (${books.length} Live Titles • 2 New Books Added Weekly)</h2>
        <p>Read the original novels, graphic novels, and nonfiction by creator <strong>Jason Coleman</strong> on Amazon Kindle, Kindle Unlimited, Paperback, Hardcover, and Audible—and pair your favorite read with matching official graphic apparel &amp; gear.</p>
      </div>
      <div class="books-header-actions">
        <a class="btn-amazon-author" href="${AMAZON_AUTHOR_URL}" target="_blank" rel="noopener">🛒 Visit Amazon Author Page (All ${books.length} Books) ↗</a>
        <a class="btn-books-hub" href="/books/">Explore All ${books.length} Books &amp; Merch →</a>
        <a class="btn-books-hub" href="/guides/" style="background:transparent;color:#fff;border-color:rgba(255,255,255,0.35)">🎁 15 Buyer's Gift Guides →</a>
      </div>
    </div>

    <div class="books-spotlight-grid" aria-label="Today's Newest Releases on Amazon">
      ${newestTwo.map(book => `
        <article class="book-spotlight-card">
          <a class="book-spotlight-cover" href="https://www.amazon.com/dp/${esc(book.primaryAsin)}" target="_blank" rel="noopener">
            <img src="${esc(book.cover)}" alt="${esc(book.title)} Official Amazon Cover" width="320" height="480" loading="eager" decoding="async">
          </a>
          <div class="book-spotlight-body">
            <div class="book-badge-row">
              <span class="book-release-badge">🔥 ${esc(book.badge || 'Published Today')}</span>
              <span class="book-genre-badge">${esc(book.series || book.genre)}</span>
              ${book.kindleUnlimited ? `<span class="book-ku-badge">✓ Kindle Unlimited</span>` : ''}
            </div>
            <h3><a href="/books/${esc(book.slug)}/">${esc(book.title)}</a></h3>
            <div class="book-spotlight-sub">${esc(book.subtitle)}</div>
            <p class="book-spotlight-desc">${esc(book.description)}</p>
            ${bookFormatButtonsHtml(book, false)}
          </div>
        </article>
      `).join('')}
    </div>

    <div class="books-grid" aria-label="All 18 Published Amazon Books by Jason Coleman">
      ${books.map(bookCardHtml).join('')}
    </div>
    ${pipelineHtml}
  </section>`;
}

export function matchBooksForProduct(p, books = []) {
  if (!books || !books.length) return [];
  const bySlug = new Map(books.map(b => [b.slug, b]));
  const hay = `${p.design || ''} ${p.name || ''} ${p.productType || ''} ${(p.themes || []).join(' ')} ${p.category || ''}`.toLowerCase();

  // Simple deterministic hash from product id so tie-breaking rotates evenly across cluster books
  let hash = 0;
  const idStr = String(p.id || p.name || '');
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash + idStr.charCodeAt(i)) | 0;
  }
  const absHash = Math.abs(hash);

  const pickTwoFromCluster = (slugs) => {
    const valid = slugs.map(s => bySlug.get(s)).filter(Boolean);
    if (valid.length <= 2) return valid;
    const firstIdx = absHash % valid.length;
    const secondIdx = (firstIdx + 1 + (absHash % (valid.length - 1))) % valid.length;
    return [valid[firstIdx], valid[secondIdx]];
  };

  // 1. Kids / Baby / Coloring / Family / Cute Animals
  if (p.kids || p.category === 'kids' || /\b(kid|kids|baby|toddler|youth|child|coloring|colorland|crayon)\b/.test(hay)) {
    return [
      bySlug.get('jay-and-jaes-adventures-in-colorland'),
      bySlug.get(absHash % 2 === 0 ? 'the-moonlight-outcasts' : 'the-world-we-leave-each-other')
    ].filter(Boolean);
  }

  // 2. Trades / Garage / Tools / Mechanic / Carpenter / Cars / Dad / Survival / DIY / Outdoor
  if (
    (p.themes && (p.themes.includes('diy') || p.themes.includes('cars'))) ||
    /\b(mechanic|garage|car|cars|truck|4x4|overland|tool|tools|wrench|carpenter|woodwork|sawdust|handyman|survival|prepper|ash|dad|father|americana|kentucky|mountain|wilderness|camp|outdoor|fishing|hunting|blue collar|built different)\b/.test(hay)
  ) {
    return [
      bySlug.get('dixons-journal-book-one-a-house-beneath-the-ash'),
      bySlug.get('the-real-americana')
    ].filter(Boolean);
  }

  // 3. Gothic / Vampire / Wolf / Raven / Dark Fantasy / RPG / Dragon / Tarot / Skull
  if (
    (p.themes && (p.themes.includes('gothic') || p.themes.includes('fantasy') || p.themes.includes('tarot'))) ||
    /\b(goth|gothic|vampire|draevan|wolf|wolves|lunar|moon|moonlight|raven|crow|skull|skeleton|reaper|wraith|dragon|knight|sword|crown|throne|rpg|d20|dungeon|witch|occult|tarot|cathedral|blood|immortal)\b/.test(hay)
  ) {
    return pickTwoFromCluster([
      'draevan-book-two-the-unclaimed',
      'the-shattered-crown',
      'the-moonlight-outcasts',
      'draevan-book-one-the-immortal',
      'the-dark-versus-light-legions-graphic-novel',
      'draevan-the-immortal-graphic-novel-book-1'
    ]);
  }

  // 4. Cyberpunk / Sci-Fi / AI / Gamer / Coding / Tech / Neon / Synthwave / Espionage
  if (
    p.category === 'tech' ||
    (p.themes && (p.themes.includes('cyber') || p.themes.includes('gamers'))) ||
    /\b(cyber|cyberpunk|sci-fi|scifi|ai|robot|android|mecha|synthwave|retro|arcade|gamer|gaming|controller|pixel|code|coding|developer|hacker|tech|matrix|neon|future|2035|alibi|spy|espionage|noir)\b/.test(hay)
  ) {
    return pickTwoFromCluster([
      'a-beautiful-alibi',
      'tiff-book-two-we-are',
      'tiff-book-one-i-am',
      'life-in-the-year-2035'
    ]);
  }

  // 5. Pets / Cats / Dogs
  if (
    p.category === 'pets' ||
    (p.themes && (p.themes.includes('cats') || p.themes.includes('dogs'))) ||
    /\b(cat|cats|kitten|feline|meow|dog|dogs|puppy|canine|pug|corgi|retriever|shepherd|pitbull|hound|paw)\b/.test(hay)
  ) {
    return pickTwoFromCluster([
      'jay-and-jaes-adventures-in-colorland',
      'the-moonlight-outcasts',
      'the-real-americana',
      'dixons-journal-book-one-a-house-beneath-the-ash'
    ]);
  }

  // 6. Military / History / Philosophy / Humor / Sarcasm / Coffee / Inspirational / Default
  if (
    (p.themes && (p.themes.includes('humor') || p.themes.includes('inspirational'))) ||
    /\b(war|military|history|spartan|warrior|strategy|veteran|politics|liar|deception|sarcastic|sarcasm|funny|humor|coffee|espresso|caffeine|philosophy|conscious|cosmos|universe|stardust|world|dignity)\b/.test(hay)
  ) {
    return pickTwoFromCluster([
      'humans-the-endless-warmonger',
      'old-men-start-wars-that-young-men-die-in',
      'the-deception-habit',
      'the-world-we-leave-each-other',
      'how-matter-became-conscious'
    ]);
  }

  // Default fallback highlights today's 2 newest releases + rotating bestsellers
  return pickTwoFromCluster([
    'dixons-journal-book-one-a-house-beneath-the-ash',
    'a-beautiful-alibi',
    'draevan-book-two-the-unclaimed',
    'tiff-book-two-we-are',
    'the-shattered-crown',
    'the-real-americana'
  ]);
}

export function productBookCrossSellHtml(p, matchedBooks = []) {
  if (!matchedBooks || !matchedBooks.length) return '';
  return `<section class="pdp-book-cross-sell" aria-label="Pair It With the Matching Book on Amazon">
    <div class="pdp-book-cross-head">
      <div>
        <span class="books-eyebrow" style="margin-bottom:4px">📚 OFFICIAL AUTHOR CROSS-SELL · JASON COLEMAN ON AMAZON</span>
        <h3>Pair It With the Matching Book on Amazon</h3>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn-book-amz" href="/books/">All 18 Amazon Books →</a>
        <a class="btn-book-amz secondary" href="${AMAZON_AUTHOR_URL}" target="_blank" rel="noopener">Amazon Author Page ↗</a>
      </div>
    </div>
    <div class="pdp-book-cross-grid">
      ${matchedBooks.slice(0, 2).map(book => `
        <article class="pdp-book-cross-item">
          <a class="pdp-book-cross-cover" href="https://www.amazon.com/dp/${esc(book.primaryAsin)}" target="_blank" rel="noopener">
            <img src="${esc(book.cover)}" alt="${esc(book.title)} Book Cover" width="140" height="210" loading="lazy" decoding="async">
          </a>
          <div class="pdp-book-cross-info">
            <span class="book-card-badge">${esc(book.badge || book.genre)}</span>
            <h4><a href="/books/${esc(book.slug)}/">${esc(book.title)}</a></h4>
            <div class="pdp-book-cross-sub">${esc(book.subtitle)}</div>
            <p class="pdp-book-cross-desc">${esc(book.description.slice(0, 170))}...</p>
            ${bookFormatButtonsHtml(book, false)}
          </div>
        </article>
      `).join('')}
    </div>
  </section>`;
}

export function productPageHtml({ p, details, typeLabel, partnerName, matchedBooks = [], relatedRowHtml = '' }) {
  return `<div class="wrap pdp-wrap">
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
          <div class="pdp-shipping-note">Made to order. See the seller's current delivery estimates and return policy.</div>
        </div>

        <div class="pdp-cta-container">
          <a class="btn-pdp-buy" href="${esc(p.url)}" target="_blank" rel="noopener">
            <span>Buy Now on Official Store — $${p.price.toFixed(2)}</span>
            <span class="cta-arrow">↗</span>
          </a>
          <div class="pdp-cta-subtext">
            <span>🔒 Direct to Official Shop</span>
            <span>⚡ Select Size &amp; Color at Checkout</span>
            <span>✓ Order Directly with Supplier</span>
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
          <span class="trust-badge-pill">🛡️ Guaranteed Secure Partner Checkout</span>
          <span class="trust-badge-pill">📦 Direct Supplier Fulfillment</span>
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
            <dt>Production Method:</dt><dd>Custom printed made to order</dd>
            <dt>Delivery &amp; Shipping:</dt><dd>Confirmed during checkout on official partner store</dd>
          </dl>
        </div>

        <div class="pdp-detail-card">
          <h3>Returns &amp; Terms</h3>
          <p>Made to order. See the seller's current delivery estimates and return policy on the checkout page.</p>
          <a class="pdp-policy-link" href="/returns/">Read Store Help &amp; Policies ↗</a>
        </div>
      </div>
    </section>

    ${relatedRowHtml}

    ${productBookCrossSellHtml(p, matchedBooks)}
  </div>`;
}


