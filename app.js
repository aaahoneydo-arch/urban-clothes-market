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
  return `<article class="product-card" data-id="${esc(p.id)}"><div class="product-image"><a href="${esc(p.path)}" aria-label="${esc(p.name)}"><img loading="lazy" decoding="async" width="400" height="400" src="${esc(p.image)}" alt="${esc(p.name)}"></a><button class="heart" data-save="${esc(p.id)}" aria-label="Save ${esc(p.name)}" aria-pressed="${favorites.has(p.id)}">${heart}</button></div><div class="product-category">${esc(p.audience)}</div><h3><a class="product-link" href="${esc(p.path)}">${esc(p.design)}</a></h3><div class="product-type">${esc(p.productType)}</div><div class="price">$${p.price.toFixed(2)}<span>Pick size &amp; colors</span></div></article>`;
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
    { type: id === 'kids' ? 'kids' : id, sort: 'shuffle', seed: crypto.randomUUID(), size: 10 } : 
    { theme: id === 'all' ? '' : id, sort: 'shuffle', seed: crypto.randomUUID(), size: 10 };
  const result = await search(filter);
  const products = await details(result.rows);
  if (products.length) {
    container.innerHTML = products.map(card).join('');
    saveState();
  }
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

  // Pagination
  if(e.target.closest('#prev')||e.target.closest('#next')){
    f.page += e.target.closest('#prev') ? -1 : 1;
    await render();
    $('#catalog').scrollIntoView({behavior:'smooth'});
  }
});

// Search form submit delegation (handles hero search, discovery searches, head search)
document.addEventListener('submit', e => {
  const form = e.target.closest('.hero-search-form, .discovery-search-form, .head-search, .searchbar');
  if(!form) return;
  e.preventDefault();
  const input = form.querySelector('input[name="q"], input[type="search"]');
  const query = (input?.value || '').trim();
  if($('#results')){
    f.q = query;
    f.page = 1;
    render();
    $('#catalog')?.scrollIntoView({behavior:'smooth'});
  } else {
    location.href = '/?q=' + encodeURIComponent(query) + '#catalog';
  }
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

saveState();
