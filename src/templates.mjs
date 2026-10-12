import {TYPES,THEMES} from './catalog-model.mjs';
export const ORIGIN='https://www.urbanclothesmarket.com';
export const SHOP='https://urbanclothesmarket.myspreadshop.com';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const icon=(name)=>'<svg aria-hidden="true" viewBox="0 0 24 24">'+({arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',shuffle:'<path d="m16 3 4 4-4 4M4 7h3c5 0 5 10 10 10h3m-4-4 4 4-4 4M4 17h3c2 0 3-2 4-4m3-5c1-1 2-1 3-1h3"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>'}[name]||'')+'</svg>';

export function card(p){
  const isApparel = ['tees','hoodies','jackets','bottoms','kids'].includes(p.category);
  const swatchesHtml = isApparel ? `<div class="card-swatches" aria-hidden="true"><span class="swatch" style="background:#171717" title="Black"></span><span class="swatch" style="background:#f5f5f5;border:1px solid #d5d5d5" title="White"></span><span class="swatch" style="background:#9e9e9e" title="Heather Grey"></span><span class="swatch" style="background:#1b2a4a" title="Navy"></span><span class="swatch-more">+colors</span></div>` : '';
  return `<article class="product-card" data-id="${esc(p.id)}"><div class="product-image"><a href="${esc(p.path)}" aria-label="${esc(p.name)}"><img loading="lazy" decoding="async" width="400" height="400" src="${esc(p.image)}" alt="${esc(p.name)}"></a><button class="heart" data-save="${esc(p.id)}" aria-label="Save ${esc(p.name)}" aria-pressed="false">${icon('heart')}</button></div><div class="product-category">${esc(p.audience)}</div><h3><a class="product-link" href="${esc(p.path)}">${esc(p.design)}</a></h3><div class="product-type">${esc(p.productType)}</div><div class="price">$${p.price.toFixed(2)}<span>Pick size &amp; colors</span></div>${swatchesHtml}</article>`;
}

export function header(){
  return `<div class="announce">⚡ 78,980+ Original Graphic Designs Across 13 Item Variations. <span>Wear Your Personality.</span></div><header class="header"><div class="wrap headrow"><a class="logo" href="/" aria-label="Urban Clothes Market home"><span class="logo-mark">UCM</span><span class="logo-text">URBAN CLOTHES<small>MARKET</small></span></a><form class="head-search" action="/#catalog" method="GET" role="search">${icon('search')}<input id="head-search-input" name="q" type="search" placeholder="Search 78,000+ items (cats, gaming, cars, hoodies, mugs...)" aria-label="Search all 78,000+ items" autocomplete="off"><kbd class="kbd-hint" aria-hidden="true">/</kbd><button type="submit">Search</button><div class="search-autocomplete" id="head-autocomplete" hidden></div></form><nav class="topnav" aria-label="Main navigation"><a href="/#catalog">Explore All</a><a href="/types/tees/">Tees &amp; Tanks</a><a href="/types/hoodies/">Hoodies</a><a href="/types/mugs/">Drinkware</a><a href="/types/hats/">Hats</a><a href="/#collections">Themes</a></nav><div class="head-actions"><button data-favorites aria-label="View favorites">${icon('heart')}<span class="pill-count" data-favcount>0</span></button></div></div></header>`;
}

export function footer(meta){
  return `<footer class="footer"><div class="wrap"><div class="foot-grid"><div><a class="logo" href="/"><span class="logo-mark">UCM</span><span class="logo-text">URBAN CLOTHES<small>MARKET</small></span></a><p>A massive collection of original graphic apparel, drinkware, and gifts for people with real passions. Designed with personality, printed when you order.</p></div><div><h4>Apparel Variations</h4><ul>${TYPES.slice(0,6).map(([id,name])=>`<li><a href="/types/${id}/">${name} (${(meta.typeCounts[id]||0).toLocaleString()})</a></li>`).join('')}</ul></div><div><h4>Lifestyle &amp; Gear</h4><ul>${TYPES.slice(6).map(([id,name])=>`<li><a href="/types/${id}/">${name} (${(meta.typeCounts[id]||0).toLocaleString()})</a></li>`).join('')}</ul></div><div><h4>Customer &amp; Orders</h4><ul><li><a href="/about/">About the market</a></li><li><a href="/shipping/">Shipping &amp; delivery</a></li><li><a href="/returns/">Returns &amp; exchanges</a></li><li><a href="/privacy/">Privacy &amp; terms</a></li><li><a href="/order-confirmation/">Order confirmation &amp; review</a></li></ul></div></div><div class="foot-bottom"><span>© ${new Date().getFullYear()} Urban Clothes Market. Made to order. Delivered directly to your door.</span><span>${meta.count.toLocaleString()} listings · Catalog verified · Google Customer Reviews partner</span></div></div></footer>
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
  return `<!DOCTYPE HTML><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Urban Clothes Market</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${ORIGIN}${path}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${ORIGIN}${path}"><meta property="og:site_name" content="Urban Clothes Market"><meta property="og:image" content="${esc(meta.hero.image)}"><meta name="theme-color" content="#d5fa42"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css?v=20261012-showcase"><script type="module" src="/app.js"></script><script id="merchantWidgetScript" src="https://www.gstatic.com/shopping/merchant/merchantwidget.js" defer></script><script>window.addEventListener("load",function(){var el=document.getElementById("merchantWidgetScript");if(el){el.addEventListener("load",function(){if(window.merchantwidget&&window.merchantwidget.start){window.merchantwidget.start({merchant_id:5871199587,position:"BOTTOM_RIGHT",region:"US"});}});}});</script>${structured?'<script type="application/ld+json">'+JSON.stringify(structured).replace(/</g,'\\u003c')+'</script>':''}</head><body>${header()}<main>${body}</main>${footer(meta)}<div id="toast" class="toast" role="status" hidden></div><div class="recent-dock" id="recent-dock" hidden><button type="button" class="recent-trigger" id="recent-trigger" aria-expanded="false"><svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Recently Viewed</span> <span class="recent-badge" id="recent-count">0</span></button><div class="recent-drawer" id="recent-drawer" hidden><div class="recent-header"><span>RECENTLY VIEWED</span><button type="button" id="clear-recent" class="recent-clear-btn">Clear All</button></div><div class="recent-items" id="recent-items"></div></div></div></body></html>`;
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

export function discoveryBar({ id, title, subtitle, placeholder = "Search 78,000+ items across all variations..." }){
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
    { id: 'cats', label: 'Cats' },
    { id: 'dogs', label: 'Dogs' },
    { id: 'gamers', label: 'Gaming' },
    { id: 'cars', label: 'Cars' },
    { id: 'humor', label: 'Humor' }
  ] : [];

  const subfilterHtml = subfilters.length ? `<div class="row-subfilters" role="group" aria-label="Sub-filters for ${esc(title)}">` +
    subfilters.map(sf => `<button type="button" class="subfilter-chip ${sf.id==='all'?'active':''}" data-row-subfilter="${sf.id}" data-target-type="${esc(id)}">${sf.label}</button>`).join('') +
  `</div>` : '';

  return `<section class="showcase-row" id="${isType ? 'type-' + id : 'theme-' + id}">
    <div class="section-head">
      <div>
        <div class="sub">${isType ? 'PRODUCT TYPE VARIATION' : 'CURATED PASSION THEME'}</div>
        <h2>${esc(title)} <span class="count-pill">${count.toLocaleString()} items</span></h2>
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
        <a class="text-link" href="${esc(link)}">View all ${count.toLocaleString()} ↗</a>
      </div>
    </div>
    ${subfilterHtml}
    <div class="scroll-track" data-track="${esc(id)}" ${isType ? `data-row-type="${esc(id)}"` : `data-row="${esc(id)}"`}>
      ${products.slice(0, 10).map(card).join('')}
    </div>
  </section>`;
}

export function themeTiles(meta){
  return `<div class="themes-grid">${['cats','dogs','gamers','urban','humor','cars','diy'].map(id=>{let t=THEMES.find(x=>x[0]===id),p=meta.themeHero[id];return `<a class="theme-tile" href="/collections/${id}/">${p?`<img src="${esc(p.image)}" alt="${esc(t[1])} designs" loading="lazy">`:''}<h3>${t[1]}</h3><small>${(meta.themeCounts[id]||0).toLocaleString()} items to discover</small><span class="arrow">↗</span></a>`;}).join('')}</div>`;
}

export function filters(meta,{type='',theme='',q=''}={}){
  return `<form class="searchbar" role="search"><label class="sr-only" for="search" style="position:absolute;clip:rect(0,0,0,0)">Search all products</label>${icon('search')}<input id="search" name="q" type="search" placeholder="Search a design, passion, or product type across all 78,000+ items…" value="${esc(q)}" autocomplete="off"><kbd class="kbd-hint" aria-hidden="true">/</kbd><button type="submit">Search</button><div class="search-autocomplete" id="catalog-autocomplete" hidden></div></form><div class="catalog-layout"><aside class="filters" id="filters"><div class="filter-title"><h3>FILTER INVENTORY</h3><button type="button" data-clear>Reset All</button></div><div class="filter-group"><label>Item Variation</label><div class="type-links"><a href="/#catalog" data-type="" ${!type?'class="active"':''}>All variations <small>${meta.count.toLocaleString()}</small></a>${TYPES.map(([id,name])=>`<a href="/types/${id}/" data-type="${id}" ${id===type?'class="active"':''}>${name}<small>${meta.typeCounts[id]||0}</small></a>`).join('')}</div></div><div class="filter-group"><label for="theme">Passion Theme</label><select id="theme"><option value="">All passion themes</option>${THEMES.filter(([id])=>id!=='all').map(([id,name])=>`<option value="${id}" ${theme===id?'selected':''}>${name} (${meta.themeCounts[id]||0})</option>`).join('')}</select></div><div class="filter-group"><label for="audience">Audience / Department</label><select id="audience"><option value="">All audiences</option>${['Men','Women','Unisex & Everyone','Kids & Babies'].map(n=>`<option>${esc(n)}</option>`).join('')}</select></div><div class="filter-group"><label for="brand">Garment Brand</label><select id="brand"><option value="">All garment brands</option><option>Champion</option><option>Stanley/Stella</option><option>Bella + Canvas</option><option>Gildan</option><option>Under Armour</option><option>Adidas</option><option>Augusta Sportswear</option><option>Bayside</option><option>Flexfit</option><option>Other brands</option></select></div><div class="filter-group"><label for="budget">Price Filter</label><select id="budget"><option value="0">Any price</option><option value="15">Up to $15</option><option value="25">Up to $25</option><option value="40">Up to $40</option><option value="60">Up to $60</option></select></div><div class="filter-tip"><strong>Massive Inventory Discovery</strong><br>Click shuffle anytime for a randomized discovery mix from our 78,000+ item catalog.</div></aside><div><div class="results-top"><span id="result-count" role="status">${meta.count.toLocaleString()} matching items. Endless personality.</span><div class="actions"><button class="mobile-filter" type="button" data-toggle-filters aria-expanded="false" aria-controls="filters">Filters +</button><button class="btn-share-wishlist" data-share-wishlist type="button" title="Copy shareable link to your favorites"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Share Wishlist</button><select id="sort" aria-label="Sort products"><option value="shuffle">Random discovery</option><option value="newest">Catalog order</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="az">Name: A to Z</option></select><button class="shuffle" data-shuffle type="button">${icon('shuffle')} Shuffle All</button></div></div><div class="active-tags" id="active-tags"></div><div class="grid" id="results">__CARDS__</div><div class="pagination"><button type="button" id="prev">← Previous</button><span id="page-count">Page 1</span><button type="button" id="next">Next →</button></div><p style="text-align:center;font-size:10px;color:var(--muted)">All prices in USD. Choose your color and size on the product page.</p></div></div>`;
}
