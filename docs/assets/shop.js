(() => {
  const field = document.querySelector('[data-variant-filter]');
  if (field) {
    const rows = Array.from(document.querySelectorAll('[data-variant]'));
    field.addEventListener('input', () => {
      const words = field.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      for (const row of rows) row.hidden = !words.every(w => row.dataset.variant.includes(w));
      document.querySelector('[data-matches]').textContent = rows.filter(row => !row.hidden).length + ' matching styles';
    });
  }
  const results = document.querySelector('[data-search-results]');
  if (!results) return;
  const form = document.querySelector('.searchform');
  const input = form.elements.q;
  const q = new URLSearchParams(location.search).get('q') || '';
  input.value = q;
  let index;
  const status = document.querySelector('[data-search-status]');
  async function show() {
    const value = input.value.trim();
    if (!value) { results.replaceChildren(); status.textContent = 'Search by design, book title, series, or video.'; return; }
    try {
      index ||= fetch(results.dataset.index).then(r => { if (!r.ok) throw Error(); return r.json(); });
      const data = await index;
      if (value !== input.value.trim()) return;
      const words = value.toLowerCase().split(/\s+/);
      const found = data.filter(x => words.every(w => (x[0]+' '+x[1]+' '+x[3]).toLowerCase().includes(w)));
      results.replaceChildren(); status.textContent = found.length ? found.length+' results for '+value : 'No results for '+value;
      let shown = 0;
      const more = document.querySelector('[data-search-more]');
      function append() {
        for (const x of found.slice(shown, shown+40)) {
          const a=document.createElement('a'), label=document.createElement('small'), title=document.createElement('strong');
          a.className='result';a.href=x[2];label.textContent=x[1];title.textContent=x[0];
          a.append(label,title);results.append(a);
        }
        shown+=40;more.hidden=shown>=found.length;
      }
      append();more.onclick=append;
    } catch { index=undefined;status.textContent='Search could not load. Browse books, designs, or videos from the navigation.'; }
  }
  form.addEventListener('submit', e => {e.preventDefault();const url=new URL(location.href);url.searchParams.set('q',input.value.trim());history.replaceState({},'',url);show();});
  let timer;input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(show,160);});
  show();
})();
(() => {
  const block=document.querySelector('[data-archive]');if(!block)return;
  const format=block.querySelector('select'), input=block.querySelector('input'), list=block.querySelector('[data-archive-list]');
  const nav=block.querySelector('[data-archive-nav]'),status=block.querySelector('[data-archive-status]');
  const prev=block.querySelector('[data-back]'),next=block.querySelector('[data-next]'),load=block.querySelector('[data-load]');
  let rows, page=0;
  async function render() {
    try {
      rows ||= fetch(block.dataset.index).then(r=>{if(!r.ok)throw Error();return r.json();});
      const data=await rows, words=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const subset=data.filter(v=>(!format.value||format.value===v[2])&&words.every(w=>v[1].toLowerCase().includes(w)));
      const pages=Math.max(1,Math.ceil(subset.length/6));page=Math.max(0,Math.min(page,pages-1));
      list.replaceChildren();
      for(const [id,title,kind] of subset.slice(page*6,page*6+6)) {
        const item=document.createElement('article'),a=document.createElement('a'), img=document.createElement('img'),h=document.createElement('h3'),titleLink=document.createElement('a'),kindText=document.createElement('p');
        item.className='video';a.className='videoimage';a.href=block.dataset.watch+id+'/';
        img.src='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';img.alt=title;img.loading='lazy';a.append(img);
        titleLink.href=a.href;titleLink.textContent=title;h.append(titleLink);kindText.textContent=kind==='shorts'?'YouTube Short':kind==='streams'?'Livestream':'Video';
        item.append(a,h,kindText);list.append(item);
      }
      nav.hidden=false;prev.disabled=page===0;next.disabled=page>=pages-1;
      status.textContent=subset.length?'Page '+(page+1)+' of '+pages+' · '+subset.length+' uploads':'No matching uploads';
    } catch { rows=undefined;nav.hidden=false;status.textContent='Open the full video archive above to continue browsing.'; }
  }
  load.onclick=()=>{page=0;render();};format.onchange=()=>{page=0;render();};
  let timer;input.oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>{page=0;render();},220);};
  prev.onclick=()=>{if(page>0)page--;render();};next.onclick=()=>{page++;render();};
})();
document.addEventListener('click', event => {
  const a=event.target.closest?.('a[href]');if(!a||typeof window.gtag!=='function')return;
  const to=new URL(a.href);
  if(to.hostname==='www.amazon.com'||to.hostname==='www.spreadshirt.com') {
    window.gtag('event','seller_product_click',{seller:to.hostname==='www.amazon.com'?'Amazon':'Spreadshirt',item_url:to.origin+to.pathname+to.search});
  } else if(to.hostname==='www.youtube.com') {
    window.gtag('event','channel_video_click',{video_url:to.href});
  }
});
