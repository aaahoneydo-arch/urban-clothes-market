const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heart='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';

let favorites=new Set();
try{favorites=new Set(JSON.parse(localStorage.getItem('ucm-favorites')||'[]'));}catch{}

function saveState(){
  try{localStorage.setItem('ucm-favorites',JSON.stringify([...favorites]));}catch{}
  $$('[data-favcount]').forEach(x=>x.textContent=favorites.size);
  $$('[data-save]').forEach(x=>{
    let on=favorites.has(x.dataset.save);
    x.setAttribute('aria-pressed',String(on));
    x.setAttribute('aria-label',(on?'Remove favorite: ':'Save: ')+(x.closest('.product-card')?.querySelector('h3')?.textContent||'this item'));
  });
}

function toast(message){
  const t=$('#toast');
  if(!t)return;
  t.textContent=message;
  t.hidden=false;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>t.hidden=true,2300);
}

function card(p){
  const isApparel = ['tees','hoodies','jackets','bottoms','kids'].includes(p.category);
  const swatchesHtml = isApparel ? `<div class="card-swatches" aria-hidden="true"><span class="swatch" style="background:#171717" title="Black"></span><span class="swatch" style="background:#f5f5f5;border:1px solid #d5d5d5" title="White"></span><span class="swatch" style="background:#9e9e9e" title="Heather Grey"></span><span class="swatch" style="background:#1b2a4a" title="Navy"></span><span class="swatch-more">+colors</span></div>` : '';
  return `<article class="product-card" data-id="${esc(p.id)}"><div class="product-image"><a href="${esc(p.path)}" aria-label="${esc(p.name)}"><img loading="lazy" decoding="async" width="400" height="400" src="${esc(p.image)}" alt="${esc(p.name)}"></a><button class="heart" data-save="${esc(p.id)}" aria-label="Save ${esc(p.name)}" aria-pressed="${favorites.has(p.id)}">${heart}</button></div><div class="product-category">${esc(p.audience)}</div><h3><a class="product-link" href="${esc(p.path)}">${esc(p.design)}</a></h3><div class="product-type">${esc(p.productType)}</div><div class="price">$${p.price.toFixed(2)}<span>Pick size &amp; colors</span></div>${swatchesHtml}<div class="card-buy-wrap"><a class="btn-card-buy" href="${esc(p.url || p.path)}" target="_blank" rel="noopener">BUY NOW!</a></div></article>`;
}

let worker=new Worker('/search-worker.js',{type:'module'}),requestId=0,pending=new Map(),shards=new Map();
worker.onmessage=({data})=>{
  const p=pending.get(data.requestId);
  if(!p)return;
  pending.delete(data.requestId);
  data.error?p.reject(Error(data.error)):p.resolve(data);
};
worker.onerror=()=>{
  for(const p of pending.values())p.reject(Error('Catalog search could not start'));
  pending.clear();
};

function search(filters){
  return new Promise((resolve,reject)=>{
    const id=++requestId;
    pending.set(id,{resolve,reject});
    worker.postMessage({requestId:id,filters});
  });
}

async function details(rows){
  let ids=[...new Set(rows.map(x=>x.shard))];
  await Promise.all(ids.map(async id=>{
    if(!shards.has(id)){
      const task=fetch('/catalog/shards/'+id+'.json').then(r=>{if(!r.ok)throw Error('Unable to load products');return r.json()});
      shards.set(id,task);
      try{await task;}catch(e){shards.delete(id);throw e;}
    }
  }));
  let map=new Map((await Promise.all(ids.map(id=>shards.get(id)))).flat().map(p=>[p.id,p]));
  return rows.map(r=>map.get(r.id)).filter(Boolean);
}

const params=new URLSearchParams(location.search),route=location.pathname.split('/').filter(Boolean);
let f={
  q:params.get('q')||'',
  type:params.get('type')||(route[0]==='types'?route[1]:''),
  theme:params.get('theme')||(route[0]==='collections'?route[1]:''),
  audience:params.get('audience')||'',
  maxPrice:params.get('maxPrice')||0,
  sort:params.get('sort')||'shuffle',
  seed:crypto.randomUUID(),
  brand:params.get('brand')||'',
  page:Number(params.get('page'))||(route[2]==='page'?Number(route[3]):1),
  size:24,
  savedOnly:params.get('saved')==='1'
};

// Parse shared wishlist from URL (e.g. ?wishlist=id1,id2,id3)
const sharedWishlist = (params.get('wishlist') || '').split(',').map(s=>s.trim()).filter(Boolean);
if(sharedWishlist.length){
  sharedWishlist.forEach(id => favorites.add(id));
  f.savedOnly = true;
  saveState();
  setTimeout(() => toast(`🎁 Loaded ${sharedWishlist.length} items from shared wishlist!`), 400);
}

let renderVersion=0;
async function render({url=true}={}){
  if(!$('#results'))return;
  const version=++renderVersion;
  $('#results').setAttribute('aria-busy','true');
  try{
    const result=await search({...f,favorites:[...favorites]});
    const products=await details(result.rows);
    if(version!==renderVersion)return;
    f.page=result.page;
    $('#results').innerHTML=products.length?products.map(card).join(''):`<div class="empty"><h3>${f.savedOnly?'Your favorites start here.':'Nothing in this mix yet.'}</h3><p>${f.savedOnly?'Tap a heart on any product to save it here.':'Try a different theme, item variation, or search phrase.'}</p><button data-clear>Browse all products</button></div>`;
    $('#result-count').textContent=result.total.toLocaleString()+' matching items'+(f.savedOnly?' · Your favorites':'');
    $('#page-count').textContent='Page '+result.page+' of '+result.pages;
    $('#prev').disabled=result.page<=1;
    $('#next').disabled=result.page>=result.pages;
    saveState();
    syncControls();
    if(url)updateUrl();
  }catch(e){
    if(version!==renderVersion)return;
    $('#result-count').textContent='Search is temporarily unavailable';
    toast('Could not load catalog. Please refresh.');
  }finally{
    if(version===renderVersion)$('#results').setAttribute('aria-busy','false');
  }
}

function syncControls(){
  if(!$('#search'))return;
  $('#search').value=f.q;
  $('#theme').value=f.theme;
  $('#audience').value=f.audience;
  $('#brand').value=f.brand;
  $('#budget').value=f.maxPrice;
  $('#sort').value=f.sort;
  $$('[data-type]').forEach(a=>a.classList.toggle('active',a.dataset.type===f.type));
  $('#active-tags').innerHTML=[['q',f.q],['type',f.type],['theme',f.theme],['audience',f.audience],['brand',f.brand],['maxPrice',Number(f.maxPrice)>0?'Under $'+f.maxPrice:''],['savedOnly',f.savedOnly?'Favorites':'']].filter(([,v])=>v).map(([k,v])=>`<button data-remove="${k}" aria-label="Remove filter ${esc(v)}">${esc(v)} ×</button>`).join('');
}

function updateUrl(){
  let p=new URLSearchParams();
  for(let k of ['q','type','theme','audience','brand','maxPrice','sort'])if(f[k]&&f[k]!==0&&f[k]!=='0'&&(k!=='sort'||f[k]!=='shuffle'))p.set(k,String(f[k]));
  if(f.savedOnly)p.set('saved','1');
  if(f.page>1)p.set('page',f.page);
  history.replaceState(null,'',location.pathname+(p.size?'?'+p:'')+'#catalog');
}

function reset(){
  f={...f,q:'',type:'',theme:'',audience:'',brand:'',maxPrice:0,sort:'shuffle',seed:crypto.randomUUID(),page:1,savedOnly:false};
  render();
}

async function renderRow(id, isType = false) {
  const selector = isType ? `[data-row-type="${id}"]` : `[data-row="${id}"]`;
  const container = $(selector);
  if (!container) return;
  const filter = isType ? 
    { type: id === 'kids' ? 'kids' : id, sort: 'shuffle', seed: crypto.randomUUID(), size: 35 } : 
    { theme: id === 'all' ? '' : id, sort: 'shuffle', seed: crypto.randomUUID(), size: 35 };
  const result = await search(filter);
  let products = await details(result.rows);
  if (products.length) {
    const isClean = p => Boolean(p.image && /flow-gen-0(6[0-9]{2}|7[0-8][0-9]|79[0-6])/i.test(p.image));
    products.sort((a, b) => (isClean(b) ? 1 : 0) - (isClean(a) ? 1 : 0));
    const seen = new Set();
    const uniqueItems = [];
    for(const p of products){
      if(!seen.has(p.design)){
        seen.add(p.design);
        uniqueItems.push(p);
      }
    }
    const link = container.dataset.rowLink || (isType ? `/types/${id}/` : `/collections/${id}/`);
    const title = container.dataset.rowTitle || id;
    const count = Number(container.dataset.rowCount) || result.total || 8000;
    const endCardHtml = `<article class="product-card end-card-showcase"><a href="${esc(link)}" class="end-card-link"><div class="end-card-badge">⚡ COUNTLESS DESIGNS</div><div class="end-card-count">+${(count > 10 ? count - 10 : count).toLocaleString()}</div><h3>More ${esc(title.split('&')[0].trim())}</h3><p>Discover thousands of original graphics, colors &amp; custom fits in this full department.</p><span class="btn-end-explore">See Entire Collection (${count.toLocaleString()}+) ↗</span></a></article>`;
    container.innerHTML = uniqueItems.slice(0, 10).map(card).join('') + endCardHtml;
    saveState();
  }
}

// RECENTLY VIEWED STORAGE & DOCK
function getRecentlyViewed(){
  try{ return JSON.parse(localStorage.getItem('ucm_recent') || '[]'); }catch{ return []; }
}
function saveRecentlyViewed(item){
  let list = getRecentlyViewed().filter(x => x.id !== item.id);
  list.unshift(item);
  if(list.length > 8) list = list.slice(0, 8);
  try{ localStorage.setItem('ucm_recent', JSON.stringify(list)); }catch{}
  renderRecentDock();
}
function renderRecentDock(){
  const dock = $('#recent-dock');
  if(!dock) return;
  const list = getRecentlyViewed();
  const count = $('#recent-count');
  if(count) count.textContent = list.length;
  if(!list.length){
    dock.hidden = true;
    return;
  }
  dock.hidden = false;
  const container = $('#recent-items');
  if(container){
    container.innerHTML = list.map(item => `
      <a class="recent-item" href="${esc(item.path)}">
        <img src="${esc(item.image)}" alt="${esc(item.design)}" loading="lazy">
        <div class="recent-item-info">
          <div class="recent-item-title">${esc(item.design)}</div>
          <div class="recent-item-price">$${Number(item.price).toFixed(2)} · ${esc(item.productType || 'Gear')}</div>
        </div>
      </a>
    `).join('');
  }
}

// CROSS-VARIATION GRAPHIC SWITCHER ON PRODUCT DETAIL PAGES
async function initVariationSwitcher(){
  const detailInfo = $('.detail-info');
  if(!detailInfo) return;
  const design = detailInfo.querySelector('h1')?.textContent?.trim();
  if(!design) return;
  try{
    const res = await search({ q: design, size: 25 });
    const items = await details(res.rows);
    const matches = items.filter(p => p.design.toLowerCase() === design.toLowerCase());
    if(matches.length <= 1) return;
    const icons = {
      tees: '👕', hoodies: '🧥', mugs: '☕', hats: '🧢', stickers: '🏷️',
      bags: '👜', art: '🖼️', home: '🏠', pets: '🐾', kids: '👶',
      bottoms: '🩳', jackets: '🧥', accessories: '✨'
    };
    const seen = new Set();
    const variations = [];
    for(const p of matches){
      if(!seen.has(p.category)){
        seen.add(p.category);
        variations.push(p);
      }
    }
    if(variations.length <= 1) return;
    const html = `
      <div class="variation-switcher">
        <div class="switcher-header">
          <span class="switcher-badge">✨ GET THIS GRAPHIC ON OTHER GEAR (${variations.length} VARIATIONS)</span>
          <small>Same original artwork printed across different items</small>
        </div>
        <div class="switcher-track">
          ${variations.map(p => {
            const isCur = location.pathname === p.path;
            const ico = icons[p.category] || '📦';
            const catName = p.category.charAt(0).toUpperCase() + p.category.slice(1);
            return `<a href="${esc(p.path)}" class="switcher-pill ${isCur?'active':''}" title="${esc(p.productType)}">
              <span>${ico} ${esc(catName)}</span>
              <span class="pill-price">$${p.price.toFixed(2)}</span>
            </a>`;
          }).join('')}
        </div>
      </div>
    `;
    const buyBtn = detailInfo.querySelector('.purchase-box') || detailInfo.querySelector('.btn.dark');
    if(buyBtn && !$('.variation-switcher')){
      buyBtn.insertAdjacentHTML('afterend', html);
    }
  }catch(e){}
}

// SEARCH AUTOCOMPLETE SETUP
function setupAutocomplete(input, dropdown){
  if(!input || !dropdown) return;
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if(q.length < 2){
      dropdown.hidden = true;
      dropdown.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(async () => {
      try{
        const res = await search({ q, size: 4 });
        const items = await details(res.rows);
        if(!items.length){
          dropdown.hidden = true;
          return;
        }
        dropdown.innerHTML = `
          <div class="autocomplete-section-title">TOP MATCHING GRAPHICS</div>
          ${items.map(p => `
            <a class="autocomplete-item" href="${esc(p.path)}">
              <img class="autocomplete-thumb" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
              <div class="autocomplete-meta">
                <div class="autocomplete-name">${esc(p.design)}</div>
                <div class="autocomplete-desc">${esc(p.productType)}</div>
              </div>
              <div class="autocomplete-price">$${p.price.toFixed(2)}</div>
            </a>
          `).join('')}
          <div class="autocomplete-section-title">NARROW SEARCH IN VARIATION</div>
          <a class="autocomplete-category-pill" href="/?q=${encodeURIComponent(q)}&type=tees#catalog">👕 Search "${esc(q)}" in Tees &amp; Tanks ↗</a>
          <a class="autocomplete-category-pill" href="/?q=${encodeURIComponent(q)}&type=hoodies#catalog">🧥 Search "${esc(q)}" in Hoodies ↗</a>
          <a class="autocomplete-category-pill" href="/?q=${encodeURIComponent(q)}&type=mugs#catalog">☕ Search "${esc(q)}" in Drinkware ↗</a>
          <a class="autocomplete-category-pill" href="/?q=${encodeURIComponent(q)}&type=stickers#catalog">🏷️ Search "${esc(q)}" in Stickers ↗</a>
        `;
        dropdown.hidden = false;
      }catch{
        dropdown.hidden = true;
      }
    }, 100);
  });
}

// Global click delegation
document.addEventListener('click', async e => {
  // Favorite button
  const save = e.target.closest('[data-save]');
  if(save){
    let id=save.dataset.save;
    if(favorites.has(id)){
      favorites.delete(id);
      toast('Removed from favorites');
    }else{
      favorites.add(id);
      toast('Saved to favorites');
    }
    saveState();
    if(f.savedOnly)render();
    return;
  }

  // Clear filters
  const clear = e.target.closest('[data-clear]');
  if(clear){
    reset();
    return;
  }

  // Remove tag
  const remove = e.target.closest('[data-remove]');
  if(remove){
    let k=remove.dataset.remove;
    f[k]=k==='savedOnly'?false:k==='maxPrice'?0:'';
    f.page=1;
    render();
    return;
  }

  // Select type filter link
  const type = e.target.closest('[data-type]');
  if(type && $('#results')){
    e.preventDefault();
    f.type = type.dataset.type;
    f.page = 1;
    render();
    return;
  }

  // Shuffle catalog
  const shuffle = e.target.closest('[data-shuffle]');
  if(shuffle){
    f.seed = crypto.randomUUID();
    f.sort = 'shuffle';
    f.page = 1;
    await render();
    toast('🎲 Fresh discovery mix loaded');
    return;
  }

  // Surprise me randomizer
  const surprise = e.target.closest('[data-surprise]');
  if(surprise){
    if($('#results')){
      f.seed = crypto.randomUUID();
      f.sort = 'shuffle';
      f.page = 1;
      await render();
      $('#catalog')?.scrollIntoView({behavior:'smooth'});
      toast('🎲 Shuffled 78,000+ items with fresh discoveries!');
    } else {
      location.href = '/?sort=shuffle#catalog';
    }
    return;
  }

  // Row horizontal scroll arrows
  const scrollBtn = e.target.closest('[data-scroll-dir]');
  if(scrollBtn){
    const track = scrollBtn.closest('.showcase-row')?.querySelector('.scroll-track');
    if(track){
      const dir = scrollBtn.dataset.scrollDir === 'next' ? 1 : -1;
      const amount = track.firstElementChild ? (track.firstElementChild.offsetWidth + 16) * 2 : 500;
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    }
    return;
  }

  // Row shuffle button
  const row = e.target.closest('[data-row-shuffle]');
  if(row){
    row.disabled = true;
    const id = row.dataset.rowShuffle;
    const isType = row.dataset.isType === 'true';
    try{
      await renderRow(id, isType);
      toast('Fresh items loaded!');
    }catch{
      toast('Unable to shuffle. Please try again.');
    }finally{
      row.disabled = false;
    }
    return;
  }

  // Row subfilter chips
  const subfilterBtn = e.target.closest('[data-row-subfilter]');
  if(subfilterBtn){
    const rowEl = subfilterBtn.closest('.showcase-row');
    const track = rowEl?.querySelector('.scroll-track');
    if(track){
      rowEl.querySelectorAll('.subfilter-chip').forEach(c => c.classList.remove('active'));
      subfilterBtn.classList.add('active');
      const subfilter = subfilterBtn.dataset.rowSubfilter;
      const targetType = subfilterBtn.dataset.targetType;
      try{
        const filter = {
          type: targetType === 'kids' ? 'kids' : targetType,
          theme: subfilter === 'all' ? '' : subfilter,
          sort: 'shuffle',
          seed: crypto.randomUUID(),
          size: 35
        };
        const result = await search(filter);
        let products = await details(result.rows);
        if(products.length){
          const isClean = p => Boolean(p.image && /flow-gen-0(6[0-9]{2}|7[0-8][0-9]|79[0-6])/i.test(p.image));
          products.sort((a, b) => (isClean(b) ? 1 : 0) - (isClean(a) ? 1 : 0));
          const seen = new Set();
          const uniqueItems = [];
          for(const p of products){
            if(!seen.has(p.design)){
              seen.add(p.design);
              uniqueItems.push(p);
            }
          }
          const link = track.dataset.rowLink || (targetType ? `/types/${targetType}/` : `/collections/${subfilter}/`);
          const title = track.dataset.rowTitle || targetType || subfilter;
          const count = Number(track.dataset.rowCount) || result.total || 8000;
          const endCardHtml = `<article class="product-card end-card-showcase"><a href="${esc(link)}" class="end-card-link"><div class="end-card-badge">⚡ COUNTLESS DESIGNS</div><div class="end-card-count">+${(count > 10 ? count - 10 : count).toLocaleString()}</div><h3>More ${esc(title.split('&')[0].trim())}</h3><p>Discover thousands of original graphics, colors &amp; custom fits in this full department.</p><span class="btn-end-explore">See Entire Collection (${count.toLocaleString()}+) ↗</span></a></article>`;
          track.innerHTML = uniqueItems.slice(0, 10).map(card).join('') + endCardHtml;
          saveState();
        }
      }catch(err){}
    }
    return;
  }

  // Share wishlist link
  if(e.target.closest('[data-share-wishlist]')){
    if(!favorites.size){
      toast('Save some favorites with ♡ first to share your wishlist!');
      return;
    }
    const shareUrl = location.origin + '/?wishlist=' + [...favorites].join(',') + '#catalog';
    try{
      await navigator.clipboard.writeText(shareUrl);
      toast('📋 Wishlist link copied to clipboard!');
    }catch{
      prompt('Copy your shareable wishlist link:', shareUrl);
    }
    return;
  }

  // View favorites
  if(e.target.closest('[data-favorites]')){
    if(!$('#results')){
      location.href = '/?saved=1#catalog';
      return;
    }
    f.savedOnly = !f.savedOnly;
    f.page = 1;
    await render();
    $('#catalog').scrollIntoView({behavior:'smooth'});
    return;
  }

  // Toggle mobile filter
  const toggle = e.target.closest('[data-toggle-filters]');
  if(toggle){
    const on = $('#filters').classList.toggle('open');
    toggle.setAttribute('aria-expanded', on);
    return;
  }

  // Toggle recently viewed drawer
  if(e.target.closest('#recent-trigger')){
    const drawer = $('#recent-drawer');
    if(drawer){
      const isHidden = drawer.hasAttribute('hidden');
      if(isHidden) drawer.removeAttribute('hidden');
      else drawer.setAttribute('hidden', '');
      $('#recent-trigger').setAttribute('aria-expanded', isHidden);
    }
    return;
  }

  // Clear recently viewed
  if(e.target.closest('#clear-recent')){
    try{ localStorage.removeItem('ucm_recent'); }catch{}
    renderRecentDock();
    $('#recent-drawer')?.setAttribute('hidden', '');
    toast('Recently viewed cleared');
    return;
  }

  // Close autocompletes if clicked outside
  if(!e.target.closest('.head-search, .searchbar, .discovery-search-form')){
    $$('.search-autocomplete').forEach(d => { d.hidden = true; });
  }

  // Close recently viewed drawer if clicked outside
  if(!e.target.closest('#recent-dock')){
    $('#recent-drawer')?.setAttribute('hidden', '');
  }

  // Pagination
  if(e.target.closest('#prev')||e.target.closest('#next')){
    f.page += e.target.closest('#prev') ? -1 : 1;
    await render();
    $('#catalog').scrollIntoView({behavior:'smooth'});
  }
});

// Search form submit delegation
document.addEventListener('submit', e => {
  const form = e.target.closest('.hero-search-form, .discovery-search-form, .head-search, .searchbar');
  if(!form) return;
  e.preventDefault();
  const input = form.querySelector('input[name="q"], input[type="search"]');
  const query = (input?.value || '').trim();
  $$('.search-autocomplete').forEach(d => { d.hidden = true; });
  if($('#results')){
    f.q = query;
    f.page = 1;
    render();
    $('#catalog')?.scrollIntoView({behavior:'smooth'});
  } else {
    location.href = '/?q=' + encodeURIComponent(query) + '#catalog';
  }
});

// Keyboard Navigation (/ to search, Esc to close)
document.addEventListener('keydown', e => {
  if(e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
    e.preventDefault();
    const searchInput = $('#head-search-input') || $('#search') || $('input[type="search"]');
    if(searchInput){
      searchInput.focus();
      searchInput.select();
    }
  }
  if(e.key === 'Escape'){
    $$('.search-autocomplete').forEach(d => { d.hidden = true; });
    $('#recent-drawer')?.setAttribute('hidden', '');
    $('#filters')?.classList.remove('open');
    $('#dept-dropdown')?.classList.remove('open');
    const menu = $('#dept-menu');
    if(menu) menu.style.display = 'none';
  }
});

// Departments dropdown toggle
$('#dept-btn')?.addEventListener('click', e => {
  e.stopPropagation();
  const dropdown = $('#dept-dropdown');
  const menu = $('#dept-menu');
  if(!dropdown || !menu) return;
  const isOpen = dropdown.classList.toggle('open');
  $('#dept-btn').setAttribute('aria-expanded', String(isOpen));
  menu.style.display = isOpen ? 'block' : 'none';
});
$('#dept-dropdown')?.addEventListener('mouseenter', () => {
  const menu = $('#dept-menu');
  if(menu) menu.style.display = 'block';
});
$('#dept-dropdown')?.addEventListener('mouseleave', () => {
  const dropdown = $('#dept-dropdown');
  if(!dropdown?.classList.contains('open')){
    const menu = $('#dept-menu');
    if(menu) menu.style.display = 'none';
  }
});
document.addEventListener('click', e => {
  if(!e.target.closest('#dept-dropdown')){
    $('#dept-dropdown')?.classList.remove('open');
    $('#dept-btn')?.setAttribute('aria-expanded', 'false');
    const menu = $('#dept-menu');
    if(menu) menu.style.display = 'none';
  }
});

// Setup autocompletes
setupAutocomplete($('#head-search-input'), $('#head-autocomplete'));
setupAutocomplete($('#search'), $('#catalog-autocomplete'));
$$('.discovery-search-form').forEach(form => {
  setupAutocomplete(form.querySelector('input'), form.querySelector('.search-autocomplete'));
});

// Real-time catalog search input debounce
if($('#search')){
  let debounce;
  $('#search').addEventListener('input',()=>{
    clearTimeout(debounce);
    debounce=setTimeout(()=>{
      f.q=$('#search').value.trim();
      f.page=1;
      render();
    },250);
  });
  for(const [id,key] of [['theme','theme'],['audience','audience'],['brand','brand'],['budget','maxPrice'],['sort','sort']]){
    const el=$('#'+id);
    if(el) el.addEventListener('change',e=>{
      f[key]=e.target.value;
      f.page=1;
      render();
    });
  }
  render({url:false});
}

// Track product detail page visit, initialize variant selector & variation switcher
const detailInfo = $('.detail-info');
if(detailInfo){
  const title = detailInfo.querySelector('h1')?.textContent?.trim() || '';
  const type = detailInfo.querySelector('h2')?.textContent?.trim() || '';
  const priceText = detailInfo.querySelector('.detail-price')?.textContent?.replace(/[^0-9.]/g,'') || '0';
  const img = $('.detail-image img')?.src || '';
  const idMatch = location.pathname.match(/-([a-z0-9]+)-([0-9]+)\/?$/i);
  const id = idMatch ? `${idMatch[1]}-${idMatch[2]}` : location.pathname;
  if(title){
    saveRecentlyViewed({ id, design: title, productType: type, price: Number(priceText), image: img, path: location.pathname });
  }
  initVariationSwitcher();
  initVariantSelector();
}

renderRecentDock();
saveState();

// DYNAMIC SHOWCASE RANDOMIZER (Fresh discovery mix on every page visit)
function initDynamicRandomizer(){
  const tracks = $$('.scroll-track[data-track]');
  if(!tracks.length) return;

  // Immediately randomize top 2 visible rows (Hoodies & Jackets) on page arrival
  const topTracks = tracks.slice(0, 2);
  topTracks.forEach(track => {
    const typeId = track.dataset.rowType;
    const themeId = track.dataset.row;
    if(typeId) renderRow(typeId, true);
    else if(themeId) renderRow(themeId, false);
  });

  // Lazy-randomize remaining tracks as user scrolls down
  const remaining = tracks.slice(2);
  if(!remaining.length) return;

  if('IntersectionObserver' in window){
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const track = entry.target;
          obs.unobserve(track);
          const typeId = track.dataset.rowType;
          const themeId = track.dataset.row;
          if(typeId) renderRow(typeId, true);
          else if(themeId) renderRow(themeId, false);
        }
      });
    }, { rootMargin: '300px 0px' });
    remaining.forEach(t => observer.observe(t));
  } else {
    remaining.forEach(track => {
      const typeId = track.dataset.rowType;
      const themeId = track.dataset.row;
      if(typeId) renderRow(typeId, true);
      else if(themeId) renderRow(themeId, false);
    });
  }
}
initDynamicRandomizer();
