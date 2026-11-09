"""Recover historical advertising URLs using exact catalog IDs and unambiguous SKU suffixes."""
import gzip,html,json,re,unicodedata
from pathlib import Path
from urllib.parse import urlsplit,unquote
from xml.sax.saxutils import escape

def normalize(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',str(s or '').lower())).strip('-')
def build_aliases(root,out,merch,domain,write_log=True):
    root,out=Path(root),Path(out);offers={o['sku']:(g,o) for g in merch for o in g['items']}
    rows={};aliases={};suffixes={}
    files=['data/catalog.json','data/catalog-additions.json','data/gothic-launch-verified.json'] if domain=='urbanclothesmarket.com' else ['real_products_catalog.json','shop/products-catalog.json','catalog-additions.json']
    for file in files:
        p=root/file
        if p.is_file():
            for r in json.loads(p.read_text()):rows.setdefault(r.get('id'),r)
    for sku in set(rows)|set(offers):
        if not sku:continue
        end=normalize(sku)[-15:]
        if end in suffixes and suffixes[end]!=sku:suffixes[end]=None
        else:suffixes[end]=sku
    def link(slug,sku):
        if re.fullmatch(r'[a-z0-9][a-z0-9_.+-]{0,235}',slug):aliases.setdefault(slug,set()).add(sku)
    for sku in set(rows)|set(offers):
        if not sku:continue
        if sku not in rows:continue
        r=rows[sku]
        if domain=='jasontvmarketplace.com':
            link(normalize(sku),sku);continue
        label=' '.join(str(v) for v in [r.get('design'),r.get('productType')] if v)
        names={normalize(label),normalize(r.get('name') or r.get('title'))}
        end=normalize(sku)[-15:]
        for n in names:
            if n:
                link(n+'-'+end,sku);link(n[:60]+'-'+end,sku)
    redirects=root/'legacy_redirect_map.json'
    if redirects.is_file():
        for key,dest in json.loads(redirects.read_text()).items():
            if not isinstance(dest,str):continue
            m=re.fullmatch(r'/products/([a-z0-9_-]+)/?',dest)
            if not m:continue
            sku=m[1];end=sku.removeprefix('spreadshop-')
            if sku in rows or sku in offers:
                if not sku.startswith('spreadshop-') or key.endswith(end) or key.endswith(sku[-15:]):link(key.strip('/'),sku)
    # Recover alternative recorded slugs from previously published sitemaps.
    for f in [*root.glob('sitemap*.xml'),*root.glob('sitemap*.xml.gz')]:
        raw=(gzip.decompress(f.read_bytes()) if f.suffix=='.gz' else f.read_bytes()).decode('utf-8','replace')
        for loc in re.findall(r'<loc>([^<]+)</loc>',raw):
            u=urlsplit(html.unescape(loc.strip()))
            if (u.hostname or '').removeprefix('www.')!=domain:continue
            m=re.fullmatch(r'/products/([^/]+)/?',unquote(u.path))
            if not m:continue
            key=m[1]
            candidate=rows.get(key,{}).get('id') or (key if key in offers else suffixes.get(key[-15:]))
            if candidate:link(key,candidate)
    esc=lambda s:html.escape(str(s),quote=True)
    created=retired=0
    for key,ids in aliases.items():
        if len(ids)!=1:continue
        sku=next(iter(ids));p=out/'products'/key/'index.html'
        if p.exists():continue
        p.parent.mkdir(parents=True,exist_ok=True)
        if sku in offers:
            g,o=offers[sku];label=g['design']+' '+o['type'];u=esc(o['url'])
            body='<p>Urban Clothes Market on Spreadshirt</p><h1>'+esc(label)+'</h1><p>$'+esc(o['price'])+' USD</p><a class="btn" href="'+u+'" target="_blank" rel="noopener">View this exact item on Spreadshirt ↗</a>'
            can='https://urbanclothesmarket.com/merch/design/'+g['slug']+'/';created+=1
        else:
            label=rows.get(sku,{}).get('name') or rows.get(sku,{}).get('title') or 'Previously listed item'
            body='<h1>This listing has been retired.</h1><p>'+esc(label)+'</p>';can='';retired+=1
        c='<link rel="canonical" href="'+esc(can)+'">' if can else ''
        p.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow">'+c+'<title>'+esc(label)+'</title><link rel="stylesheet" href="../../assets/shop.css"></head><body><main class="frame errorbox">'+body+'<p><a class="shoplink" href="../../merch/">Browse merchandise</a> · <a class="shoplink" href="../../books/">Browse books</a></p></main></body></html>',encoding='utf-8')
    # Unknown historical naming conventions can recover only an exact, unique known sellable.
    fallback={k:[v,offers[v][1]['url']] for k,v in suffixes.items() if v in offers}
    (out/'assets/legacy-skus.json').write_text(json.dumps(fallback,separators=(',',':')))
    f=out/'404.html';s=f.read_text()
    tag='<script src="/assets/old-product.js" defer></script>'
    if tag not in s:f.write_text(s.replace('</head>',tag+'</head>'))
    (out/'assets/old-product.js').write_text("""(() => {
  const match=location.pathname.match(/^\\/products\\/([a-z0-9_-]+)\\/?$/i);
  if(!match)return;
  fetch('/assets/legacy-skus.json').then(r=>r.ok?r.json():{}).then(ids=>{
    const key=match[1].toLowerCase();
    const record=ids[key.slice(-15)];if(!Array.isArray(record))return;
    const [id,url]=record;
    if(typeof id!=='string'||!/^spreadshop-[a-z0-9]+-\\d+$/.test(id))return;
    if(key!==id && !key.endsWith('-'+id.slice(-15)))return;
    const seller=new URL(url);
    if(seller.origin==='https://www.spreadshirt.com' && seller.pathname.startsWith('/shop/design/') && seller.searchParams.get('sellable')===id.slice(11))location.replace(seller.href);
  }).catch(()=>{});
})();\n""")
    report={'activeAliasesAdded':created,'retiredAliasesAdded':retired,'unambiguousActiveSuffixes':len(fallback)}
    if write_log:print('Advertising aliases',report)
    return report
if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--out',required=True);parser.add_argument('--catalog',required=True);parser.add_argument('--domain',required=True);args=parser.parse_args()
    build_aliases(args.root,args.out,json.loads(gzip.decompress(Path(args.catalog).read_bytes())),args.domain)
