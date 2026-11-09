(() => {
  const match=location.pathname.match(/^\/products\/([a-z0-9_-]+)\/?$/i);
  if(!match)return;
  fetch('/assets/legacy-skus.json').then(r=>r.ok?r.json():{}).then(ids=>{
    const key=match[1].toLowerCase();
    const record=ids[key.slice(-15)];if(!Array.isArray(record))return;
    const [id,url]=record;
    if(typeof id!=='string'||!/^spreadshop-[a-z0-9]+-\d+$/.test(id))return;
    if(key!==id && !key.endsWith('-'+id.slice(-15)))return;
    const seller=new URL(url);
    if(seller.origin==='https://www.spreadshirt.com' && seller.pathname.startsWith('/shop/design/') && seller.searchParams.get('sellable')===id.slice(11))location.replace(seller.href);
  }).catch(()=>{});
})();
