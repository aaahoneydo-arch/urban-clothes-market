"""Preserve known first-party advertising and search URLs without reviving retired sellers."""
import csv,gzip,html,io,json,re,shutil
from pathlib import Path
from urllib.parse import urlsplit,unquote
from xml.sax.saxutils import escape
from build import esc,amz,buy,compact,ORIGINS
def install(store,old):
    old=Path(old).resolve()
    if (old/'CNAME').read_text().strip()!=urlsplit(store.host).hostname:raise ValueError('Wrong production repository')
    existing={p.relative_to(store.out).as_posix() for p in store.out.rglob('*.html')}
    bookids={f['asin']:b for b in store.books for f in b['formats']}
    videoids={v['id'] for v in store.archive}
    pathmap={}
    oldmap=old/'checkout/legacy-routes.json'
    if oldmap.is_file():pathmap.update(json.loads(oldmap.read_text()))
    count={'exact_merch':0,'redirect':0,'retired':0}
    retired_files=[];route_ids={}
    def redirect(p,dest,label):
        safe=esc(store.host+dest);ab=esc(store.host+dest)
        p.parent.mkdir(parents=True,exist_ok=True);p.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(label)+'</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="'+ab+'"><meta http-equiv="refresh" content="0;url='+safe+'"><p><a href="'+safe+'">'+esc(label)+'</a></p></html>',encoding='utf-8');count['redirect']+=1
    def write_old(rel,sku=None,title=None,dest=None):
        if rel in existing or rel.startswith(('docs/','storefront/','dist/','.git/')):return
        parts=Path(rel).parts
        if '..' in parts or not parts or rel.startswith('/'):return
        p=store.out/rel;p.parent.mkdir(parents=True,exist_ok=True)
        route='/'+rel.removesuffix('index.html') if rel.endswith('/index.html') else '/'+rel
        if sku in store.skus:
            g,item=store.skus[sku];route_ids[sku]=route;n=g['design']+' · '+item['type'];dest='/merch/design/'+g['slug']+'/'
            c='<div class="crumb">'+store.link('/merch/','Merchandise')+'</div>'+store.heading(n,'Sold by Urban Clothes Market on Spreadshirt.')+'<div class="actions">'+buy(item['url'],'View exact item on Spreadshirt')+store.link(dest,'Compare styles')+'</div><p class="muted">Seller price checked at $'+esc(item['price'])+' USD. Select your size and color on the seller’s page.</p>'
            store.page(route,n,g['description'] or n,c,canonical=ORIGINS['urban']+dest,index=False);count['exact_merch']+=1
        elif dest:redirect(p,dest,title or store.name)
        else:
            name=title or 'Previously listed item'
            name=html.unescape(re.split(r' \| (?:Urban Clothes|Jason)',name)[0]).strip()[:170]
            p.write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><base href="'+store.base(route)+'"><title>'+esc(name)+' | '+esc(store.name)+'</title><link rel="stylesheet" href="'+store.url('/assets/shop.css')+'"><main class="frame errorbox"><p>'+esc(store.name)+'</p><h1>This listing has been retired.</h1><p>'+esc(name)+'</p><p>Browse current graphic merchandise and books from Jason Coleman.</p><div class="actions">'+store.link('/merch/','Browse merchandise','btn')+store.link('/books/','Browse books','btn')+'</div></main></html>',encoding='utf-8');count['retired']+=1
        existing.add(rel)
    import subprocess
    files=subprocess.check_output(['git','-C',str(old),'ls-files','-z','*.html']).decode('utf8').split('\0')
    for rel in files:
        if not rel or rel in existing or rel.startswith(('docs/','storefront/','dist/','.git/')):continue
        f=old/rel
        if not f.is_file():continue
        if re.fullmatch(r'google[a-z0-9]+\.html',rel,re.I):
            shutil.copy2(f,store.out/rel);continue
        data=f.read_text(encoding='utf-8',errors='replace');title=re.search(r'<title[^>]*>(.*?)</title>',data,re.S|re.I);title=title[1] if title else None
        sku=None;dest=None
        if rel.startswith('products/'):
            sku=pathmap.get(str(Path(rel).parent).replace('\\','/'))
            if not sku:
                m=re.search(r'"sku"\s*:\s*"([^"]+)"',data) or re.search(r'name="withheld-product-id" content="([^"]+)"',data)
                sku=m[1] if m else Path(rel).parent.name
        elif rel in ['spreadshop.html','shop/index.html']:dest='/merch/'
        elif rel.startswith('types/'):
            typ=rel.split('/')[1];key={'hoodies':'hoodies','tees':'tees','kids':'kids','bottoms':'other','jackets':'other','bags':'accessories','hats':'accessories','pets':'accessories','accessories':'accessories'}.get(typ,'home');dest='/merch/'+key+'/'
        elif rel.startswith('collections/') or rel in ['lookbook/index.html']:dest='/merch/'
        elif rel.startswith('books/') or rel in ['books.html','amazon-author-page.html']:
            hits={bookids[a]['slug'] for a in re.findall(r'/dp/([A-Z0-9]{10})',data) if a in bookids}
            dest='/books/'+next(iter(hits))+'/' if len(hits)==1 else '/books/'
        elif rel.startswith('episodes/') or 'youtube.com/embed/' in data:
            vids={v for v in re.findall(r'(?:youtube(?:-nocookie)?\.com/embed/|youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})',data) if v in videoids}
            if len(vids)==1:dest='/watch/'+next(iter(vids))+'/'
        write_old(rel,sku,title,dest)
    previous=old/'docs'
    if (previous/'release.json').is_file():
        for oldpath in files:
            if not oldpath.startswith('docs/') or not oldpath.endswith('.html'):continue
            rel=oldpath[5:]
            if rel in existing:continue
            src=old/oldpath
            if not src.is_file():continue
            data=src.read_text(encoding='utf-8',errors='replace');name=re.search(r'<title[^>]*>(.*?)</title>',data,re.S|re.I)
            sku=None;dest=None
            hit=re.fullmatch(r'merch/item/([a-z0-9]+-\d+)/index.html',rel)
            if hit:sku='spreadshop-'+hit[1]
            if rel.startswith('books/'):
                targets={bookids[a]['slug'] for a in re.findall(r'/dp/([A-Z0-9]{10})',data) if a in bookids}
                if len(targets)==1:dest='/books/'+next(iter(targets))+'/'
            if rel.startswith('watch/') and not dest:dest='/watch/'
            write_old(rel,sku,name[1] if name else None,dest)
    # Also materialize product landing URLs still appearing in existing ad feeds.
    for f in [*old.glob('*merchant*.xml'),*old.glob('*merchant*.xml.gz')]:
        try:
            raw=(gzip.decompress(f.read_bytes()) if f.suffix=='.gz' else f.read_bytes()).decode('utf-8-sig')
        except (OSError,UnicodeError):continue
        for m in re.finditer(r'<item>(.*?)</item>',raw,re.S):
            s=m[1];link=re.search(r'<g:link>(.*?)</g:link>',s,re.S);sku=re.search(r'<g:id>(.*?)</g:id>',s,re.S)
            if not link or not sku:continue
            u=urlsplit(html.unescape(link[1]).strip())
            if (u.hostname or '').removeprefix('www.')!=urlsplit(store.host).hostname or not re.fullmatch('/products/[a-zA-Z0-9_.%+/-]+/?',u.path):continue
            path=unquote(u.path).strip('/')
            if '..' in Path(path).parts:continue
            write_old(path+'/index.html',html.unescape(sku[1]),None)
    for f in old.glob('*.txt'):
        if re.fullmatch(r'(?:google[a-z\d]+|[a-f0-9]{24,64})\.txt',f.name,re.I):shutil.copy2(f,store.out/f.name)
    for n in ['favicon.ico','favicon.svg','apple-touch-icon.png','apple-touch-icon-precomposed.png','BingSiteAuth.xml']:
        if (old/n).is_file():shutil.copy2(old/n,store.out/n)
    for f in old.glob('sitemap*.xml'):
        if f.name!='sitemap.xml' and 'merchant' not in f.name:shutil.copy2(store.out/'sitemap.xml',store.out/f.name)
    if (old/'sw.js').exists():
        (store.out/'sw.js').write_text("self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));\nself.addEventListener('activate', e => e.waitUntil((async()=>{for(const n of await caches.keys())if(n.startsWith('jasontv-storefront-'))await caches.delete(n);await self.clients.claim();await self.registration.unregister();})()));\n")
    if (old/'app.js').exists():
        (store.out/'app.js').write_text("if(!document.body.matches('.urban,.jason')){try{const key='storefront-upgraded-v2';if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');location.reload();}}catch{}}\n")
    if (old/'search-worker.js').exists():(store.out/'search-worker.js').write_text("self.onmessage=({data})=>self.postMessage({requestId:data.requestId,total:0,pages:1,page:1,rows:[]});\n")
    if (old/'style.css').exists():(store.out/'style.css').write_text("@import url('/assets/shop.css');\n")
    (store.out/'CNAME').write_text(urlsplit(store.host).hostname+'\n')
    print('Legacy route reconciliation',count)
