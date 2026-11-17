"""Build one static storefront from the shared checked catalog. Python standard library only."""
import argparse,collections,concurrent.futures,gzip,html,json,os,re,shutil
from pathlib import Path
from urllib.parse import urlencode,urlsplit,parse_qs
from xml.sax.saxutils import escape as xml_escape

SRC=Path(__file__).resolve().parent
ORIGINS={'urban':'https://urbanclothesmarket.com','jason':'https://jasontvmarketplace.com'}
NAMES={'urban':'Urban Clothes Market','jason':'Jason TV Marketplace'}

# Official Spreadshop audience views (cross-cutting) and disjoint product-type categories.
# Existing keys ('hoodies','tees','kids','accessories','home','other') are preserved for route stability.
AUDIENCES=[
    ('men',"Men's Clothing",r"^(?:men['’`´]?s\b|long body men|augusta sportswear men)"),
    ('women',"Women's Clothing",r"^(?:women['’`´]?s\b|american apparel women|champion women|stanley/stella nora women|slim fit rib women|washed women)"),
    ('unisex','Unisex Streetwear',r"\bunisex\b|adult tie dye hoodie|gildan heavy blend adult|champion packable|oversized|full button jersey|tie dye long sleeve|stanley/stella cultivator"),
    ('kids','Kids, Toddlers & Babies',r"\bkids?\b|\bkid['’`´]?s\b|toddler|baby|babies|infant|youth"),
]
DEPTS=[
    ('kids','Kids & Babies',r"\bkids?\b|\bkid['’`´]?s\b|toddler|baby|babies|infant|youth"),
    ('hoodies','Hoodies & Sweatshirts',r"hoodie|hooded|sweatshirt|pullover|fleece"),
    ('hats','Hats, Caps & Beanies',r"beanie|trucker|\bcap\b|(?<!santa )\bhat\b"),
    ('bags','Bags, Totes & Backpacks',r"\bbag\b|backpack|tote|pouch|fanny pack|duffel"),
    ('drinkware','Mugs, Tumblers & Water Bottles',r"mug|tumbler|water bottle|\bcup\b"),
    ('stickers','Stickers, Magnets, Pins & Keychains',r"sticker|magnet|buttons|keychain"),
    ('posters','Posters & Wall Art',r"\bposter\b"),
    ('jackets','Jackets, Polos & Activewear',r"jacket|windbreaker|\bpolo\b|joggers|\bshort\b|full button jersey"),
    ('tees','T-Shirts, Tanks & Tops',r"t-shirt|tee\b|tank|sleeveless|henley|v-neck|long sleeve"),
    ('home','Home, Pillows & Aprons',r"pillow|apron|mouse\s*pad|blanket|towel"),
    ('accessories','Bandanas, Socks & Pets',r"bandana|socks|\bdog\b"),
    ('other','Plush & Seasonal Gifts',r"."),
]
_AUD_RX=[(k,l,re.compile(p,re.I)) for k,l,p in AUDIENCES]
_DEPT_RX=[(k,l,re.compile(p,re.I)) for k,l,p in DEPTS]
_DEPT_LABELS=dict((k,l) for k,l,_ in [*DEPTS,*AUDIENCES])

esc=lambda s:html.escape(str(s),quote=True)
def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
def slug(v):return re.sub(r'[^a-z0-9]+','-',str(v).lower()).strip('-')[:75]
def spr_slug(s):
    s=str(s or '').lower()
    for ch in ("’","'","´","‘",'"','.', '/'):s=s.replace(ch,'')
    return re.sub(r'[^a-z0-9-]+','+',s).strip('+')
def first_sentence(s,lim=168):
    s=' '.join(str(s or '').split());return s if len(s)<=lim else s[:lim-1].rsplit(' ',1)[0]+'.'
def dept(s):
    for k,_,rx in _DEPT_RX:
        if rx.search(s):return k
    return 'other'
def audience(s):
    for k,_,rx in _AUD_RX:
        if rx.search(s):return k
    return ''
def amz(asin):
    if not re.fullmatch('[A-Z0-9]{10}',asin):raise ValueError('Invalid book identifier')
    return 'https://www.amazon.com/dp/'+asin
def buy(url,label,css='btn'):return '<a class="'+css+'" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(label)+' ↗</a>'
def picture(url,alt,early=False,low=False):
    attrs='decoding="async" fetchpriority="high"' if early else ('loading="lazy" decoding="async" fetchpriority="low"' if low else 'loading="lazy" decoding="async"')
    return '<img src="'+esc(url)+'" alt="'+esc(alt)+'" '+attrs+'>'
def optimized(url,w,h):
    u=urlsplit(url)
    if u.hostname!='image.spreadshirtmedia.com':return url
    q=parse_qs(u.query);q['width']=[str(w)];q['height']=[str(h)]
    return u._replace(query=urlencode(q,doseq=True)).geturl()
def batches(xs,n):return [xs[i:i+n] for i in range(0,len(xs),n)] or [[]]
def video_image(id):return 'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'
def readgzip(f):return json.loads(gzip.decompress(f.read_bytes()))
def meta_obj(kind,**attrs):return {'@context':'https://schema.org','@type':kind,**attrs}
def _write_html(args):
    p,body=args
    p.write_text(body,encoding='utf-8')

class Store:
    def __init__(self,target,destination,prefix='',preview=False):
        self.target=target;self.out=Path(destination);self.prefix='/'+prefix.strip('/') if prefix.strip('/') else ''
        self.preview=preview;self.name=NAMES[target];self.host=ORIGINS[target];self.urls=[];self.search=[];self.counts=collections.Counter()
        self._dirs=set();self._pending=[]
        from evidence import check
        self.verification=check(SRC/'merch.json.gz')
        self.designs=readgzip(SRC/'merch.json.gz');self.books=json.loads((SRC/'books.json').read_text());self.archive=readgzip(SRC/'archive.json.gz')
        self.related=json.loads((SRC/'videos.json').read_text())
        for g in self.designs:
            if not g['items']:raise ValueError(g['id'])
            for o in g['items']:
                u=urlsplit(o['url']);q=parse_qs(u.query)
                if u.scheme!='https' or u.hostname!='www.spreadshirt.com' or not u.path.startswith('/shop/design/') or not u.path.endswith('-D'+g['id']) or q.get('sellable')!=[o['sku'].removeprefix('spreadshop-')] or len(q.get('appearance',[]))!=1:raise ValueError(o['sku'])
        if len({o['sku'] for g in self.designs for o in g['items']})!=sum(len(g['items']) for g in self.designs):raise ValueError('Duplicate seller SKU')
        self.bybook={b['slug']:b for b in self.books}
        self.detail_items={o['sku'] for g in self.designs for o in g['items'] if o.get('image') or (o['sku']==g['primary'] and g.get('image'))}
        self.desmap={g['id']:g for g in self.designs}
        self.skus={v['sku']:(g,v) for g in self.designs for v in g['items']}
        self.channel='https://www.youtube.com/@jasontvyoutube'
        self.metadata=json.loads((SRC/'site-meta.json').read_text())[target]
    def url(self,path):return self.prefix+path if self.prefix else (path.lstrip('/') or './')
    def base(self,path):
        if path == '/404.html' and not self.preview:
            return self.prefix + '/'
        depth=len([p for p in path.strip('/').split('/') if p])-(0 if path.endswith('/') else 1)
        return '../'*max(0,depth) or './'
    def write(self,path,body):
        p=self.out/path.lstrip('/');p=p/'index.html' if path.endswith('/') else p
        if p.parent not in self._dirs:p.parent.mkdir(parents=True,exist_ok=True);self._dirs.add(p.parent)
        p.write_text(body,encoding='utf-8')
    def queue_page(self,path,body):
        p=self.out/path.lstrip('/');p=p/'index.html' if path.endswith('/') else p
        if p.parent not in self._dirs:p.parent.mkdir(parents=True,exist_ok=True);self._dirs.add(p.parent)
        self._pending.append((p,body))
    def flush_pages(self):
        if not self._pending:return
        with concurrent.futures.ThreadPoolExecutor(16) as pool:
            list(pool.map(_write_html,self._pending,chunksize=64))
        self._pending.clear()
    def link(self,path,text,cl='textlink'):return f'<a class="{cl}" href="{esc(self.url(path))}">{esc(text)}</a>'
    def render_page(self,path,title,desc,content,structured=None,canonical=None,index=True,img=None):
        canonical=canonical or self.host+path
        if index and canonical==self.host+path:self.urls.append(canonical)
        kind=self.target
        word=('<span class="mark">UC</span><span>Urban Clothes<br><small>Market</small></span>' if kind=='urban' else '<span class="mark">JC</span><span>Jason TV<br><small>Marketplace</small></span>')
        nav=''.join(self.link(h,t,'') for h,t in ([('/merch/','Merchandise'),('/books/','Books'),('/watch/','Watch')] if kind=='urban' else [('/books/','Books'),('/merch/','Merchandise'),('/watch/','Watch')]))
        ld='' if not structured else '<script type="application/ld+json">'+compact(structured).replace('<','\\u003c')+'</script>'
        robots='noindex,follow' if self.preview or not index else 'index,follow,max-image-preview:large'
        ga=self.metadata.get('ga')
        tracking=(''.join(self.metadata.get('verify',[])) + ('<script async src="https://www.googletagmanager.com/gtag/js?id='+ga+'"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","'+ga+'");</script>' if ga else '')) if not self.preview else ''
        return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="{self.base(path)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} | {esc(self.name)}</title><meta name="description" content="{esc(first_sentence(desc,175))}"><meta name="robots" content="{robots}"><link rel="canonical" href="{esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(first_sentence(desc))}"><meta property="og:url" content="{esc(canonical)}">{('<meta property="og:image" content="'+esc(img)+'">') if img else ''}<link rel="stylesheet" href="{self.url('/assets/shop.css')}"><script defer src="{self.url('/assets/shop.js')}"></script>{ld}{tracking}</head><body class="{kind}"><a class="skip" href="{self.url(path)}#main">Skip to content</a><header class="top"><div class="frame nav"><a class="wordmark" href="{self.url('/')}" aria-label="{esc(self.name)} home">{word}</a><nav class="navlinks" aria-label="Primary">{nav}{self.link('/search/','Search','searchlink')}</nav></div></header><main id="main" class="frame">{content}</main><footer class="foot"><div class="frame"><p><strong>{esc(self.name)}</strong><br>Merchandise orders through Spreadshirt. Book orders through Amazon.</p><div class="lowernav">{self.link('/merch/','Browse merchandise')}{self.link('/books/','Browse books')}{self.link('/watch/','Videos and Shorts')}{self.link('/orders/','Order help')}{self.link('/privacy/','Privacy')}</div></div></footer></body></html>'''
    def page(self,path,title,desc,content,structured=None,canonical=None,index=True,img=None):
        body=self.render_page(path,title,desc,content,structured,canonical,index,img)
        self.queue_page(path,body);self.counts['pages']+=1
    def heading(self,title,desc=''):return '<header class="pagehead"><h1>'+esc(title)+'</h1>'+('<p>'+esc(desc)+'</p>' if desc else '')+'</header>'
    def shelf(self,title,body,path=None,action=None,klass=''):
        return '<section class="shelf '+klass+'"><div class="shelf-head"><h2>'+esc(title)+'</h2>'+(self.link(path,action) if path else '')+'</div>'+body+'</section>'
    def itempath(self,item):return '/merch/item/'+item['sku'].removeprefix('spreadshop-')+'/'
    def designcard(self,g,override=None,early=False,low=False):
        v=override or g['items'][0];url='/merch/design/'+g['slug']+'/'
        n_styles=len(g['items'])
        style_lbl='1 style →' if n_styles==1 else f'All {n_styles} styles →'
        # Direct Spreadshirt product checkout links on image, title, and primary button.
        image=picture(optimized(g['image'],560,700),g['design']+' on '+g['items'][0]['type'],early=early,low=low) if g['image'] else '<span class="unpictured">'+esc(g['design'])+'</span>'
        if override and override['sku']!=g['primary'] and not override.get('image'):
            return '<article class="card stylecard"><div class="tag">'+esc(_DEPT_LABELS.get(dept(override['type']),override['type']))+'</div><h3><a href="'+esc(override['url'])+'" target="_blank" rel="noopener">'+esc(g['design'])+'</a></h3><p>'+esc(override['type'])+'</p><p class="card-amount">$'+esc(override['price'])+' USD</p><div class="card-actions">'+buy(override['url'],'Buy on Spreadshirt','btn btn-buy')+self.link(url,style_lbl,'morestyles')+'</div></article>'
        if override and override.get('image'):image=picture(optimized(override['image'],560,700),g['design']+' on '+override['type'],early=early,low=low)
        return '<article class="card"><a class="picture" href="'+esc(v['url'])+'" target="_blank" rel="noopener" aria-label="Shop '+esc(g['design']+' '+v['type'])+' on Spreadshirt">'+image+'</a><div class="tag">'+esc(v['type'])+'</div><h3><a href="'+esc(v['url'])+'" target="_blank" rel="noopener">'+esc(g['design'])+'</a></h3><p class="card-amount">$'+esc(v['price'])+' USD</p><div class="card-actions">'+buy(v['url'],'Buy on Spreadshirt','btn btn-buy')+self.link(url,style_lbl,'morestyles')+'</div></article>'
    def bookcard(self,b):
        u='/books/'+b['slug']+'/';im=picture(b['image'],b['title']+' book cover')
        return '<article class="card bookcard"><a class="picture bookpic" href="'+esc(amz(b['asin']))+'" target="_blank" rel="noopener" aria-label="View '+esc(b['title'])+' on Amazon">'+im+'</a><div class="tag">'+esc(b['formats'][0]['format'])+'</div><h3>'+self.link(u,b['title'],'')+'</h3>'+buy(amz(b['asin']),'View on Amazon','shoplink')+'</article>'
    def videoc(self,v):
        u='/watch/'+v['id']+'/';label='YouTube Short' if v['kind']=='shorts' else 'Livestream' if v['kind']=='streams' else 'Video'
        return '<article class="video"><a class="videoimage" href="'+self.url(u)+'">'+picture(video_image(v['id']),v['title'])+'</a><h3>'+self.link(u,v['title'],'')+'</h3><p>'+label+'</p></article>'
    def cards(self,data,func):return '<div class="cards collection-grid">'+''.join(func(x) for x in data)+'</div>'
    def pager(self,base,n,total):
        p=lambda i:base if i==1 else base+'page/'+str(i)+'/'
        return '<nav aria-label="Pages" class="pages">'+(self.link(p(n-1),'← Previous') if n>1 else '')+'<span>Page '+str(n)+' of '+str(total)+'</span>'+(self.link(p(n+1),'Next →') if n<total else '')+'</nav>' if total>1 else ''
    def build_products_index(self,ordered):
        IMG_PFX='https://image.spreadshirtmedia.com/image-server/v1/'
        d_rows=[];t_map={};t_rows=[];items=[]
        for d_idx,g in enumerate(ordered):
            uid36=g['items'][0]['sku'].removeprefix('spreadshop-').rsplit('-',1)[0]
            # Derive the design's canonical Spreadshirt URL slug from its actual primary/first item path
            u0=urlsplit(g['items'][0]['url'])
            raw0=u0.path.removeprefix('/shop/design/').removesuffix('-D'+g['id'])
            cand=spr_slug(g['design'])
            if not raw0.startswith(cand+'+'):
                # Longest prefix common across items of this design before '+type'
                t0=spr_slug(g['items'][0]['type'])
                cand=raw0.removesuffix('+'+t0) if raw0.endswith('+'+t0) else raw0.split('+',1)[0]
            d_img=optimized(g['image'],400,500) if g.get('image') else ''
            if d_img.startswith(IMG_PFX):d_img='@'+d_img[len(IMG_PFX):]
            d_rows.append([g['id'],g['slug'],g['design'],uid36,cand,d_img])
            for o in g['items']:
                tname=o['type'];u=urlsplit(o['url']);q=parse_qs(u.query)
                sku_short=o['sku'].removeprefix('spreadshop-')
                s_uid,pt_id=sku_short.rsplit('-',1)
                app_id=q['appearance'][0]
                raw=u.path.removeprefix('/shop/design/').removesuffix('-D'+g['id'])
                if raw.startswith(cand+'+'):
                    tslug=raw[len(cand)+1:];custom_path=''
                else:
                    tslug=spr_slug(tname);custom_path=raw
                tkey=(tname,pt_id,tslug)
                if tkey not in t_map:
                    dk=dept(tname);ak=audience(tname)
                    t_map[tkey]=len(t_rows)
                    t_rows.append([tname,pt_id,tslug,dk,ak,_DEPT_LABELS.get(dk,dk)])
                t_idx=t_map[tkey]
                cents=round(float(o['price'])*100)
                in_det=1 if o['sku'] in self.detail_items else 0
                v_img=''
                if o.get('image'):
                    v_img=optimized(o['image'],400,500)
                    if v_img.startswith(IMG_PFX):v_img='@'+v_img[len(IMG_PFX):]
                custom_uid='' if s_uid==uid36 else s_uid
                # Verify byte-for-byte URL reconstruction so 0 search links can ever drift!
                re_path=custom_path if custom_path else (cand+'+'+tslug)
                re_url=f"https://www.spreadshirt.com/shop/design/{re_path}-D{g['id']}?appearance={app_id}&sellable={(custom_uid or uid36)}-{pt_id}"
                if re_url!=o['url']:raise ValueError('Product index URL mismatch: '+re_url+' vs '+o['url'])
                row=[d_idx,t_idx,cents,app_id,in_det,custom_path,v_img]
                if custom_uid:row.append(custom_uid)
                items.append(row)
        payload={'v':2,'imgPfx':IMG_PFX,'total':len(items),'designs':d_rows,'types':t_rows,'items':items}
        self.write('/assets/products-index.json',compact(payload))
        return len(items)
    def catalog_browser_html(self,default_dept='',placeholder=None,show_quick_chips=False):
        n_skus=len(self.skus);n_des=len(self.designs)
        ph=placeholder or f'Search all {n_skus:,} verified products (e.g. hoodie, mug, griffin, cane corso, cap, toddler)…'
        opts=['<option value="">All Spreadshop categories ('+f'{n_skus:,}'+')</option>']
        opts.append('<optgroup label="Shop by Department">')
        for k,label,_ in AUDIENCES:opts.append(f'<option value="{esc(k)}"'+(' selected' if default_dept==k else '')+f'>{esc(label)}</option>')
        opts.append('</optgroup><optgroup label="Shop by Product Category">')
        for k,label,_ in DEPTS:
            if k=='kids':continue
            opts.append(f'<option value="{esc(k)}"'+(' selected' if default_dept==k else '')+f'>{esc(label)}</option>')
        opts.append('</optgroup>')
        ptype_filters=[
            ('','All 212 product styles'),
            ('hoodie','Pullover & Zip Hoodies'),
            ('zip hoodie','Zip Hoodies'),
            ('sweatshirt','Crewneck & Quarter-Zip Sweatshirts'),
            ('t-shirt','T-Shirts (All Cuts)'),
            ('tank','Tank Tops & Sleeveless'),
            ('long sleeve','Long Sleeve Shirts'),
            ('polo|henley|jersey','Polos, Henleys & Jerseys'),
            ('jacket|windbreaker','Jackets & Windbreakers'),
            ('unisex short|short set|joggers','Shorts & Activewear'),
            ('trucker|cap|hat','Caps & Trucker Hats'),
            ('beanie','Beanies'),
            ('mug','Coffee & Travel Mugs'),
            ('water bottle|tumbler','Water Bottles & Tumblers'),
            ('backpack','Backpacks'),
            ('tote|drawstring|pouch','Totes, Pouches & Drawstring Bags'),
            ('sticker|magnet','Stickers & Magnets'),
            ('keychain|buttons','Keychains & Pin Buttons'),
            ('poster','Posters & Wall Art'),
            ('apron','Aprons'),
            ('pillow|mouse','Throw Pillows & Mousepads'),
            ('bodysuit|bib|one piece','Baby Bodysuits & Bibs'),
            ('kids|youth|toddler','Kids & Toddler Apparel'),
            ('socks|bandana','Socks, Bandanas & Pet Gear'),
        ]
        ptype_opts=''.join(f'<option value="{esc(v)}">{esc(lbl)}</option>' for v,lbl in ptype_filters)
        quick_html=''
        if show_quick_chips:
            theme_chips=[
                ('Gothic & Crests','gothic'),
                ('Self Made','self made'),
                ('Family & Loyalty','family & loyalty'),
                ('Wolves & Dogs','wolves & dogs'),
                ('Cats & Panters','cats & panthers'),
                ('Dragons & Phoenix','dragons & phoenix'),
                ('Gaming & Anime','gaming & anime'),
                ('Cars & Garage','cars & garage'),
                ('New York & LA','city crests'),
                ('Roses & Nature','roses & floral'),
            ]
            # Fix typo cleanly: Cats & Panthers
            theme_chips[4]=('Cats & Panthers','cats & panthers')
            pick_chips=[
                ('Hoodies','hoodie'),
                ('Zip Hoodies','zip hoodie'),
                ('Graphic Tees','t-shirt'),
                ('Tank Tops','tank'),
                ('Caps & Trucker Hats','trucker|cap|hat'),
                ('Beanies','beanie'),
                ('Mugs','mug'),
                ('Water Bottles','water bottle|tumbler'),
                ('Backpacks','backpack'),
                ('Tote Bags','tote|drawstring|pouch'),
                ('Stickers','sticker|magnet'),
                ('Posters','poster'),
                ('Aprons','apron'),
                ('Kids Apparel','kids|youth|toddler'),
                ('Baby Gear','bodysuit|bib|one piece'),
            ]
            quick_html=(
                '<div class="quick-rows">'
                '<div class="quick-row" role="group" aria-label="Quick design theme filters"><span class="quick-label">Themes</span>'
                '<button type="button" class="chip current" data-quick-reset>All Featured</button>'
                +''.join(f'<button type="button" class="chip" data-quick-q="{esc(qv)}">{esc(lbl)}</button>' for lbl,qv in theme_chips)
                +'</div>'
                '<div class="quick-row" role="group" aria-label="Quick Spreadshop product type filters"><span class="quick-label">Styles</span>'
                +''.join(f'<button type="button" class="chip" data-quick-ptype="{esc(pv)}">{esc(lbl)}</button>' for lbl,pv in pick_chips)
                +'</div></div>'
            )
        return (
            f'<section class="catalog-finder" data-catalog-finder data-index="{esc(self.url("/assets/products-index.json"))}" data-design-base="{esc(self.url("/merch/design/"))}" data-item-base="{esc(self.url("/merch/item/"))}" data-default-dept="{esc(default_dept)}">'
            f'<form class="searchform catalog-controls" role="search">'
            f'<input type="search" name="q" aria-label="Search all verified Spreadshirt products" placeholder="{esc(ph)}">'
            f'<select name="dept" aria-label="Filter by Spreadshop category">{"".join(opts)}</select>'
            f'<select name="ptype" aria-label="Filter by specific garment or product style">{ptype_opts}</select>'
            f'<select name="sort" aria-label="Sort products"><option value="rel">Featured</option><option value="pa">Price: Low to High</option><option value="pd">Price: High to Low</option><option value="az">Design A–Z</option></select>'
            f'<button class="btn" type="submit">Search</button>'
            f'<button class="pill reset-btn" type="button" data-catalog-reset hidden>Reset filters ✕</button>'
            f'</form>'
            f'{quick_html}'
            f'<p class="muted" data-catalog-status>Search across all {n_skus:,} verified Spreadshirt products across {n_des} designs — every item links directly to its exact Spreadshirt product checkout page.</p>'
            f'<div class="cards collection-grid" data-catalog-results hidden></div>'
            f'<div class="actions" style="margin-top:20px"><button class="btn" type="button" data-catalog-more hidden>Show more matching products</button></div>'
            f'</section>'
        )
    def pick_diverse_photographed(self,pairs,limit,prefer_diverse_types=True):
        photo_pairs=[(g,o) for g,o in pairs if o.get('image') or (o['sku']==g['primary'] and g.get('image'))]
        photo_pairs.sort(key=lambda z:(0 if z[1].get('image') else 1,0 if z[1]['sku']==z[0]['primary'] else 1,-len(z[0]['items']),z[0]['design'].lower(),z[1]['type']))
        if not prefer_diverse_types:return photo_pairs[:limit]
        by_type=collections.defaultdict(list)
        for pair in photo_pairs:by_type[pair[1]['type']].append(pair)
        type_keys=list(by_type.keys())
        cursors={t:0 for t in type_keys}
        picked=[];seen_skus=set();seen_designs=set()
        while len(picked)<limit:
            added=False
            for t in type_keys:
                arr=by_type[t];idx=cursors[t]
                while idx<len(arr) and (arr[idx][1]['sku'] in seen_skus or arr[idx][0]['id'] in seen_designs):
                    idx+=1
                if idx<len(arr):
                    pair=arr[idx];cursors[t]=idx+1
                    picked.append(pair);seen_skus.add(pair[1]['sku']);seen_designs.add(pair[0]['id']);added=True
                    if len(picked)>=limit:break
            if not added:break
        if len(picked)<limit:
            for pair in photo_pairs:
                if pair[1]['sku'] not in seen_skus:
                    picked.append(pair);seen_skus.add(pair[1]['sku'])
                    if len(picked)>=limit:break
        return picked
    def home(self):
        ordered=getattr(self,'ordered',None)
        dept_pairs=getattr(self,'dept_pairs',None)
        aud_pairs=getattr(self,'aud_pairs',None)
        if ordered is None or dept_pairs is None or aud_pairs is None:
            ordered=sorted(self.designs,key=lambda x:(-len(x['items']),x['design'].lower()))
            dept_pairs=collections.defaultdict(list);aud_pairs=collections.defaultdict(list)
            for g in ordered:
                for o in g['items']:
                    dept_pairs[dept(o['type'])].append((g,o))
                    ak=audience(o['type'])
                    if ak:aud_pairs[ak].append((g,o))
        bytitle=lambda s:next((b for b in self.books if s.lower() in b['title'].lower()),self.books[0])
        books=[bytitle(s) for s in ['The Shattered Crown','A Beautiful Alibi','The People We Carry','A House Beneath The Ash']]
        g=next((d for d in self.designs if d['id']=='328187cff306452c'),self.designs[0]);h=g['items'][0];b=books[0]
        merch=[g];themes=['Kitsune','Direwolves','Gargoyle','Dragon','Lion','Raven','Rose']
        for theme in themes:
            found=next((d for d in self.designs if d not in merch and theme.lower() in d['design'].lower() and len(d['items'])>9),None)
            if found:merch.append(found)
        for d in ordered:
            if len(merch)>=24:break
            if d not in merch:merch.append(d)
        featured=self.archive[:3]
        shorts=[v for v in self.archive if v['kind']=='shorts'][:3]

        if self.target=='jason':
            title='Books by Jason Coleman, original merchandise and videos'
            hero='<div class="kicker">Jason Coleman · Fantasy</div><h1>The Shattered<br>Crown</h1><p>Kaia Blackwood, a blacksmith’s daughter, lives in the shadow of the Cinderpeak Mountains. When the Crown Shards break, ancient wraiths awaken.</p><div class="actions">'+buy(amz(b['asin']),'Read on Amazon')+self.link('/books/'+b['slug']+'/','Explore the book')+'</div>'
            art=picture(b['image'],'The Shattered Crown by Jason Coleman',True)
            home_search=(
                f'<section class="shelf"><div class="shelf-head"><h2>Search all {len(self.skus):,} products</h2>'+self.link('/merch/','Open full catalog →')+'</div>'
                f'<form class="searchform" action="{esc(self.url("/search/"))}" method="get" role="search">'
                f'<input type="search" name="q" aria-label="Search catalog" placeholder="Search {len(self.skus):,} verified shirts, hoodies, mugs, hats, bags, books, or videos…">'
                f'<button class="btn" type="submit">Search catalog</button></form>'
                f'<div class="filters" aria-label="Shop by Spreadshop Category">'
                +self.link('/merch/men/',"Men's Clothing",'pill')
                +self.link('/merch/women/',"Women's Clothing",'pill')
                +self.link('/merch/unisex/','Unisex Streetwear','pill')
                +self.link('/merch/kids/','Kids & Babies','pill')
                +self.link('/merch/hoodies/','Hoodies & Sweatshirts','pill')
                +self.link('/merch/tees/','T-Shirts & Tops','pill')
                +self.link('/merch/hats/','Hats & Beanies','pill')
                +self.link('/merch/bags/','Bags & Totes','pill')
                +self.link('/merch/drinkware/','Mugs & Drinkware','pill')
                +self.link('/merch/stickers/','Stickers & Magnets','pill')
                +self.link('/merch/posters/','Posters & Wall Art','pill')
                +self.link('/merch/home/','Home & Aprons','pill')
                +'</div></section>'
            )
            sections=[self.shelf('Explore the books',self.cards(books,self.bookcard),'/books/','All books →'),home_search,self.shelf('From Urban Clothes Market',self.cards(merch[:4],self.designcard),'/merch/','All merchandise →')]
            videos=self.shelf('Videos from Jason TV','<div class="videos">'+''.join(self.videoc(v) for v in featured)+'</div>','/watch/','Full video archive →')
            if shorts:videos+=self.shelf('YouTube Shorts','<div class="videos">'+''.join(self.videoc(v) for v in shorts)+'</div>','/watch/shorts/','All Shorts →')
            videos+='<section class="archive-browser" data-archive data-index="'+self.url('/assets/videos.json')+'" data-watch="'+self.url('/watch/')+'"><h3>Explore the full channel</h3><div class="archive-controls"><label>Format <select aria-label="Video format"><option value="">All uploads</option><option value="videos">Videos</option><option value="shorts">Shorts</option><option value="streams">Livestreams</option></select></label><input aria-label="Search channel videos" type="search" placeholder="Search video titles"><button class="btn" data-load>Browse all '+format(len(self.archive),',')+' uploads</button></div><div class="videos" data-archive-list></div><div class="pages" data-archive-nav hidden><button class="pill" data-back>Previous</button><span aria-live="polite" data-archive-status></span><button class="pill" data-next>Next</button></div></section>'
            self.page('/',title,f'Explore Jason Coleman books, originals on Amazon, official Urban Clothes Market Spreadshirt merchandise, and Jason TV videos.','<section class="hero"><div class="hero-copy">'+hero+'</div><div class="hero-art">'+art+'</div></section>'+''.join(sections)+videos+self.guide(),meta_obj('WebSite',name=self.name,url=self.host+'/'),img=b['image'])
            return

        # Urban Clothes Market: Hero-Free Extensive Spreadshop-First Storefront
        title=f'Shop {len(self.skus):,} verified Spreadshirt products across {len(self.designs)} designs'
        header_html=(
            f'<section class="storefront-header">'
            f'<div class="storefront-title-row"><div><div class="kicker">{len(self.skus):,} Verified Spreadshop Products · {len(self.designs)} Original Designs · 212 Styles</div>'
            f'<h1>Urban Clothes Market</h1></div>'
            f'<p class="storefront-note">Every product photo, title, and button links straight to its official Spreadshirt product page for sizing, color choices, and checkout.</p></div>'
            f'{self.catalog_browser_html("", show_quick_chips=True)}'
            f'</section>'
        )

        # Build 24 diverse Featured Mix picks spanning all 12 departments with distinct designs
        feat_depts=['hoodies','tees','hats','drinkware','bags','jackets','kids','posters','stickers','home','accessories','other']
        feat_pools={dk:self.pick_diverse_photographed(dept_pairs.get(dk,[]),12,prefer_diverse_types=True) for dk in feat_depts}
        feat_mix=[];feat_skus=set();feat_designs=set()
        for pass_idx in range(4):
            for dk in feat_depts:
                for pair in feat_pools.get(dk,[]):
                    if pair[1]['sku'] not in feat_skus and pair[0]['id'] not in feat_designs:
                        feat_mix.append(pair);feat_skus.add(pair[1]['sku']);feat_designs.add(pair[0]['id'])
                        break
                if len(feat_mix)>=24:break
            if len(feat_mix)>=24:break
        if len(feat_mix)<24:
            for pair in self.pick_diverse_photographed([(dg,dg['items'][0]) for dg in ordered],36):
                if pair[1]['sku'] not in feat_skus:
                    feat_mix.append(pair);feat_skus.add(pair[1]['sku'])
                    if len(feat_mix)>=24:break

        home_gift_pairs=[*dept_pairs.get('home',[]),*dept_pairs.get('posters',[]),*dept_pairs.get('accessories',[]),*dept_pairs.get('other',[])]
        tabs_spec=[
            ('featured',f'Featured Mix ({len(self.skus):,})',feat_mix[:24],'/merch/',f'Browse all {len(self.skus):,} products →',''),
            ('hoodies',f'Hoodies & Sweatshirts ({len(dept_pairs["hoodies"]):,})',self.pick_diverse_photographed(dept_pairs['hoodies'],16),'/merch/hoodies/',f'All {len(dept_pairs["hoodies"]):,} hoodies & sweatshirts →','hoodies'),
            ('tees',f'T-Shirts, Tanks & Tops ({len(dept_pairs["tees"]):,})',self.pick_diverse_photographed(dept_pairs['tees'],16),'/merch/tees/',f'All {len(dept_pairs["tees"]):,} shirts & tops →','tees'),
            ('men',f"Men's ({len(aud_pairs['men']):,})",self.pick_diverse_photographed(aud_pairs['men'],16),'/merch/men/',f"All {len(aud_pairs['men']):,} men's items →",'men'),
            ('women',f"Women's ({len(aud_pairs['women']):,})",self.pick_diverse_photographed(aud_pairs['women'],16),'/merch/women/',f"All {len(aud_pairs['women']):,} women's items →",'women'),
            ('kids',f'Kids & Babies ({len(dept_pairs["kids"]):,})',self.pick_diverse_photographed(dept_pairs['kids'],16),'/merch/kids/',f'All {len(dept_pairs["kids"]):,} kids & baby items →','kids'),
            ('hats',f'Hats & Beanies ({len(dept_pairs["hats"]):,})',self.pick_diverse_photographed(dept_pairs['hats'],16),'/merch/hats/',f'All {len(dept_pairs["hats"]):,} hats & beanies →','hats'),
            ('drinkware',f'Mugs & Bottles ({len(dept_pairs["drinkware"]):,})',self.pick_diverse_photographed(dept_pairs['drinkware'],16),'/merch/drinkware/',f'All {len(dept_pairs["drinkware"]):,} mugs & drinkware →','drinkware'),
            ('bags',f'Bags & Backpacks ({len(dept_pairs["bags"]):,})',self.pick_diverse_photographed(dept_pairs['bags'],16),'/merch/bags/',f'All {len(dept_pairs["bags"]):,} bags & totes →','bags'),
            ('jackets',f'Jackets, Polos & Active ({len(dept_pairs["jackets"]):,})',self.pick_diverse_photographed(dept_pairs['jackets'],16),'/merch/jackets/',f'All {len(dept_pairs["jackets"]):,} jackets & activewear →','jackets'),
            ('stickers',f'Stickers & Keychains ({len(dept_pairs["stickers"]):,})',self.pick_diverse_photographed(dept_pairs['stickers'],16),'/merch/stickers/',f'All {len(dept_pairs["stickers"]):,} stickers & pins →','stickers'),
            ('home',f'Home, Posters & Gifts ({len(home_gift_pairs):,})',self.pick_diverse_photographed(home_gift_pairs,16),'/merch/home/','Browse Home, Posters & Gifts →','home'),
        ]
        tab_btns=[]
        tab_panels=[]
        for idx,(tk,tlabel,tpairs,cpath,ccta,dfilter) in enumerate(tabs_spec):
            is_active=(idx==0)
            sel_attr='aria-selected="true" focusgroupstart' if is_active else 'aria-selected="false" tabindex="-1"'
            tab_btns.append(f'<button type="button" role="tab" id="tab-{tk}" {sel_attr} data-panel="panel-{tk}">{esc(tlabel)}</button>')
            cards_html=[]
            for c_idx,(dg,do) in enumerate(tpairs):
                cards_html.append(self.designcard(dg,do,early=(is_active and c_idx<2),low=(not is_active)))
            filter_btn=f'<button type="button" class="pill" data-filter-dept="{esc(dfilter)}">Filter &amp; sort all {esc(tlabel.split(" (",1)[0])} live</button>' if dfilter else ''
            panel_attr='' if is_active else ' hidden="until-found"'
            tab_panels.append(
                f'<div role="tabpanel" id="panel-{tk}" aria-labelledby="tab-{tk}"{panel_attr}>'
                f'<div class="tabpanel-inner"><div class="cards collection-grid">{"".join(cards_html)}</div>'
                f'<div class="actions tabpanel-foot">{self.link(cpath,ccta,"btn")}{filter_btn}</div></div></div>'
            )
        tabs_section=(
            f'<section class="merch-tabs" data-merch-tabs>'
            f'<div class="tablist-scroller scroller" role="tablist" focusgroup="tablist nomemory" aria-label="Spreadshop product categories">{"".join(tab_btns)}</div>'
            f'<div class="tabpanels">{"".join(tab_panels)}</div>'
            f'</section>'
        )

        # Spreadshop Full Directory Grid (15 categories)
        dir_tiles=[]
        for k,label,_ in AUDIENCES:
            cnt=len(aud_pairs.get(k,[]))
            if cnt:dir_tiles.append(f'<a class="dept-tile" href="{esc(self.url("/merch/"+k+"/"))}"><strong>{esc(label)}</strong><span>{cnt:,} verified products →</span></a>')
        for k,label,_ in DEPTS:
            if k=='kids':continue
            cnt=len(dept_pairs.get(k,[]))
            if cnt:dir_tiles.append(f'<a class="dept-tile" href="{esc(self.url("/merch/"+k+"/"))}"><strong>{esc(label)}</strong><span>{cnt:,} verified products →</span></a>')
        dept_dir_html=self.shelf('Browse all Spreadshop departments','<div class="dept-grid">'+''.join(dir_tiles)+'</div>','/merch/',f'All {len(self.skus):,} products →','deferred-section')

        # 24 Original Designs Showcase using diverse garment photography
        design_picks=[]
        for d_idx,dg in enumerate(merch[:24]):
            photographed=[o for o in dg['items'] if o.get('image')] or [dg['items'][0]]
            chosen=photographed[d_idx % len(photographed)]
            design_picks.append(self.designcard(dg,chosen))
        designs_showcase=self.shelf(f'Explore {len(merch[:24])} featured designs ({len(self.designs)} total)','<div class="cards collection-grid">'+''.join(design_picks)+'</div>','/merch/',f'All {len(self.designs)} designs →','deferred-section')

        # Small Compact Books + Videos/Shorts strip placed cleanly at the bottom above footer
        book_minis=''.join(
            f'<div class="mini-item"><a class="mini-book-thumb" href="{esc(amz(bk["asin"]))}" target="_blank" rel="noopener"><img src="{esc(bk["image"])}" alt="{esc(bk["title"])} cover" loading="lazy" decoding="async" width="44" height="64"></a>'
            f'<div class="mini-meta"><a class="mini-title" href="{esc(self.url("/books/"+bk["slug"]+"/"))}">{esc(bk["title"])}</a>'
            f'<span>{esc(bk["formats"][0]["format"])} · <a class="shoplink" href="{esc(amz(bk["asin"]))}" target="_blank" rel="noopener">Amazon ↗</a></span></div></div>'
            for bk in books
        )
        mini_vids=[*featured[:2],*shorts[:2]]
        vid_minis=''.join(
            f'<div class="mini-item"><a class="mini-vid-thumb" href="{esc(self.url("/watch/"+v["id"]+"/"))}"><img src="{esc(video_image(v["id"]))}" alt="{esc(v["title"])}" loading="lazy" decoding="async" width="84" height="48"></a>'
            f'<div class="mini-meta"><a class="mini-title" href="{esc(self.url("/watch/"+v["id"]+"/"))}">{esc(v["title"])}</a>'
            f'<span>{"YouTube Short" if v["kind"]=="shorts" else "Video"}</span></div></div>'
            for v in mini_vids
        )
        archive_details=(
            f'<details class="mini-archive-details"><summary>Search all {len(self.archive):,} Jason TV videos &amp; Shorts</summary>'
            f'<div class="archive-browser" data-archive data-index="{self.url("/assets/videos.json")}" data-watch="{self.url("/watch/")}">'
            f'<div class="archive-controls"><label>Format <select aria-label="Video format"><option value="">All uploads</option><option value="videos">Videos</option><option value="shorts">Shorts</option><option value="streams">Livestreams</option></select></label>'
            f'<input aria-label="Search channel videos" type="search" placeholder="Search video titles">'
            f'<button class="btn" type="button" data-load>Browse all {len(self.archive):,} uploads</button></div>'
            f'<div class="videos" data-archive-list></div>'
            f'<div class="pages" data-archive-nav hidden><button type="button" class="pill" data-back>Previous</button><span aria-live="polite" data-archive-status></span><button type="button" class="pill" data-next>Next</button></div>'
            f'</div></details>'
        )
        bottom_secondary=(
            f'<section class="bottom-secondary deferred-section" aria-label="Books by Jason Coleman and Jason TV Videos">'
            f'<div class="bottom-secondary-grid">'
            f'<div class="compact-media-box"><div class="compact-head"><h2>Books by Jason Coleman</h2>{self.link("/books/",f"All {len(self.books)} books →")}</div><div class="mini-list">{book_minis}</div></div>'
            f'<div class="compact-media-box"><div class="compact-head"><h2>Videos &amp; YouTube Shorts</h2><div class="compact-links">{self.link("/watch/","Videos →")} · {self.link("/watch/shorts/","Shorts →")}</div></div><div class="mini-list">{vid_minis}</div>{archive_details}</div>'
            f'</div></section>'
        )

        main_content=(
            header_html
            +'<div data-static-catalog>'
            +tabs_section
            +dept_dir_html
            +designs_showcase
            +'</div>'
            +self.guide()
            +bottom_secondary
        )
        self.page('/',title,f'Shop {len(self.skus):,} verified Urban Clothes Market Spreadshirt products across {len(self.designs)} designs and 212 styles. Every item links directly to Spreadshirt checkout.',main_content,meta_obj('WebSite',name=self.name,url=self.host+'/'),img=g['image'])
    def guide(self):
        L=self.link
        if self.target=='urban':
            parts=[('Finding a graphic that works on the garment','A crowned phoenix framed by dark roses reads differently on a hoodie than on a mug. Start with the artwork in '+L('/merch/','the design catalog')+', or search all '+f'{len(self.skus):,}'+' verified products directly. Every listed variation names the actual garment or accessory and links directly to that exact item on Spreadshirt.'),
                   ('Gothic streetwear, crests and animal artwork','Look for the details that distinguish each illustration. The Self Made phoenix stands over a blacksmith’s anvil. The Family direwolves guard a silver tree, while the New York gargoyle collection draws on stone cathedral sculpture. Browse by design or open '+L('/merch/men/',"Men's Clothing")+', '+L('/merch/women/',"Women's Clothing")+', '+L('/merch/unisex/','Unisex Streetwear')+', or the '+L('/merch/hoodies/','hoodie collection')+'.'),
                   ('Choosing sizes, colors and gifts','A men’s premium hoodie, a unisex shirt and a youth garment have different measurements. Open the seller’s exact product page to compare its size chart and choose an available color. For gifts that do not need a clothing size, browse '+L('/merch/drinkware/','mugs & drinkware')+', '+L('/merch/stickers/','stickers & magnets')+', or '+L('/merch/home/','home goods and aprons')+'.'),
                   ('Books beyond the clothing collection','Jason Coleman also writes fantasy, science fiction, espionage and nonfiction. '+L('/books/','Browse the books')+' to compare the available Kindle, print and audiobook editions. Where a title has a trailer or narrated graphic novel, the book page links to the matching video below the purchase options.')]
        else:
            parts=[('Where to start with Jason Coleman’s fiction','For fantasy, The Shattered Crown follows Kaia Blackwood and the broken Crown Shards. A Beautiful Alibi opens Mara Voss’s espionage story. For post-apocalyptic fiction, start Dixon’s Journal with A House Beneath the Ash. The '+L('/books/','book catalog')+' shows the title and edition on Amazon, making it easier to start with the first volume or find the next installment.'),
                   ('Science fiction, vampires and graphic novels','The People We Carry opens The Andromeda War. The TIFF series begins with I AM. Draevan’s vampire novels and his graphic novel adaptation have distinct Amazon listings. Open a book page to see its cover and the editions Amazon lists for it. The '+L('/watch/','video archive')+' includes matching narrated comics and trailers alongside the rest of the channel.'),
                   ('Nonfiction by subject','Readers interested in politics can find The Deception Habit and Old Men Start Wars That Young Men Die In. How Matter Became Conscious explores consciousness, while The World We Leave Each Other takes up dignity and responsibility. Each book has its own page so readers searching by title or subject can reach the correct Amazon edition.'),
                   ('Original graphic apparel and gifts','The '+L('/merch/','Urban Clothes Market collection')+' brings together '+f'{len(self.skus):,}'+' Spreadshirt products across '+str(len(self.designs))+' original designs. Browse by Spreadshop category or open any exact product checkout directly on Spreadshirt. Books open on Amazon, and both sellers show checkout and delivery details before purchase.')]
        featured=[g for g in self.designs if g.get('description') and len(g['items'])>=10]
        if self.target=='urban':
            parts.extend([
                ('From cathedral crests to city landmarks','The catalog gives each illustration its own page, which is useful when a search begins with an image rather than a garment. '+(' '.join(self.link('/merch/design/'+g['slug']+'/',g['design'])+'. '+esc(first_sentence(g['description'],150).rstrip('.'))+'.' for g in sorted(featured,key=lambda x:x['design'])[:2]))),
                ('Finding a shirt, hoodie or accessory in the same design','Open the design page and use its style filter. Typing hoodie narrows the list to hoodies using that artwork. Typing mug, shirt or bag shows matching entries where the seller offers them. The price beside each style refers to that specific item. The seller page shows the print placement, available colors and current delivery options.'),
                ('Discover the stories behind the books','The collection also includes vampire fiction, post-apocalyptic survival stories and nonfiction by Jason Coleman. A reader looking for a narrated comic can open Draevan or The Dark Versus Light Legions, watch the matching adaptation, and return to the Amazon edition links. Readers can also browse '+self.link('/watch/shorts/','Jason TV Shorts')+' or search the '+self.link('/watch/','full video archive')+' by title.')])
        else:
            parts.extend([
                ('Choose a reading format','A Kindle edition, paperback, hardcover and audiobook can each have a different Amazon listing. The edition buttons on this site use the identifiers on Jason Coleman’s author page. If Amazon lists two formats for a title, both appear on its book page. The seller shows delivery, device compatibility and any subscription reading options for the edition you select.'),
                ('Reading after the ashfall or entering the espionage series','In Dixon’s Journal, a Yellowstone eruption turns an ordinary family’s basement into shelter. A House Beneath the Ash starts the survival story. A Beautiful Alibi follows Mara Voss from a fabricated drug case into an intelligence assignment. Browsing both titles makes it easier to choose between a first-person survival account and a spy novel built around deception.'),
                ('Go from a video to the work it accompanies','Open a title in the '+self.link('/watch/','Jason TV video archive')+' to find its own watch page. Where a trailer or graphic novel directly adapts a book, the page links back to that book’s Amazon editions. The '+self.link('/watch/shorts/','Shorts collection')+' and '+self.link('/watch/streams/','livestream archive')+' have separate pages, so viewers can browse short clips or longer programs by format.'),
                ('Search the shelves by subject','A search for a gothic phoenix, Japanese fox artwork, an original vampire graphic novel or a book about consciousness can start in the '+self.link('/search/','site search')+'. Results compare all '+f'{len(self.skus):,}'+' verified products alongside designs, books and videos.')])
        return '<section class="guidecopy deferred-section"><h2>'+('A guide to the collection' if self.target=='urban' else 'Explore Jason Coleman’s books and work')+'</h2><div class="guidecolumns">'+''.join('<section><h3>'+esc(t)+'</h3><p>'+d+'</p></section>' for t,d in parts)+'</div></section>'
    def build(self):
        self.out.mkdir(parents=True,exist_ok=True);(self.out/'assets').mkdir(exist_ok=True);self._dirs.add(self.out);self._dirs.add(self.out/'assets')
        shutil.copy2(SRC/'site.css',self.out/'assets/shop.css');shutil.copy2(SRC/'site.js',self.out/'assets/shop.js')
        if (SRC/'fonts').is_dir():shutil.copytree(SRC/'fonts',self.out/'assets/fonts',dirs_exist_ok=True)
        ordered=sorted(self.designs,key=lambda x:(-len(x['items']),x['design'].lower()))
        self.build_products_index(ordered)

        # Precompute exact category buckets across all verified items before rendering home & category pages
        dept_pairs=collections.defaultdict(list)
        aud_pairs=collections.defaultdict(list)
        for g in ordered:
            for o in g['items']:
                dept_pairs[dept(o['type'])].append((g,o))
                ak=audience(o['type'])
                if ak:aud_pairs[ak].append((g,o))

        self.ordered=ordered;self.dept_pairs=dept_pairs;self.aud_pairs=aud_pairs
        self.home()

        def make_chips(active=''):
            aud_bar='<nav class="filters" aria-label="Shop by Department">'
            aud_bar+=self.link('/merch/',f'All designs ({len(self.designs)})','pill'+( ' current' if active=='' else ''))
            for k,t,_ in AUDIENCES:
                cnt=len(aud_pairs.get(k,[]))
                if cnt:aud_bar+=self.link('/merch/'+k+'/',f'{t} ({cnt:,})','pill'+(' current' if active==k else ''))
            aud_bar+='</nav><nav class="filters" aria-label="Browse by Spreadshop product category">'
            for k,t,_ in DEPTS:
                if k=='kids':continue
                cnt=len(dept_pairs.get(k,[]))
                if cnt:aud_bar+=self.link('/merch/'+k+'/',f'{t} ({cnt:,})','pill'+(' current' if active==k else ''))
            return aud_bar+'</nav>'

        all_cats=[('','All designs & graphic merchandise',[(g,g['items'][0]) for g in ordered],False)]
        for k,label,_ in AUDIENCES:
            if k!='kids' and aud_pairs.get(k):all_cats.append((k,label,aud_pairs[k],True))
        for k,label,_ in DEPTS:
            if dept_pairs.get(k):all_cats.append((k,label,dept_pairs[k],True))

        for key,label,pairs,sort_items in all_cats:
            if sort_items:pairs.sort(key=lambda pair:(pair[1]['sku'] not in self.detail_items,pair[1]['sku']!=pair[0]['primary'],pair[0]['design'],pair[1]['type']))
            base='/merch/'+(key+'/' if key else '');pages=batches(pairs,24);chips=make_chips(key)
            for i,items in enumerate(pages,1):
                path=base if i==1 else base+'page/'+str(i)+'/'
                finder=self.catalog_browser_html(key,show_quick_chips=(i==1)) if i==1 else ''
                body_grid=self.cards(items,lambda z:self.designcard(z[0],z[1]))+self.pager(base,i,len(pages))
                if i==1:body_grid='<div data-static-catalog>'+body_grid+'</div>'
                sub=f'{len(pairs):,} verified products — search all {len(self.skus):,} Spreadshirt items above or browse page {i} of {len(pages)} below.' if key else f'{len(self.designs)} original designs ({len(self.skus):,} total verified Spreadshirt products) — search or pick a category below.'
                content=self.heading(label,sub)+finder+chips+body_grid
                canonical=(ORIGINS['urban']+path) if self.target=='jason' else None
                self.page(path,label+(f' · Page {i}' if i>1 else ''),'Browse '+label.lower()+' from Urban Clothes Market, with direct links to each verified Spreadshirt product.',content,canonical=canonical,index=(i==1))

        for g in ordered:
            first=g['items'][0];path='/merch/design/'+g['slug']+'/'
            self.search.append([g['design'],'Design',self.url(path),' '.join(dict.fromkeys(o['type'] for o in g['items']))])
            rows=''.join('<tr data-variant="'+esc(o['type'].lower())+'"><td>'+(self.link(self.itempath(o),o['type'],'shoplink') if o['sku'] in self.detail_items else esc(o['type']))+'</td><td>'+esc(_DEPT_LABELS.get(dept(o['type']),''))+'</td><td>$'+esc(o['price'])+'</td><td>'+buy(o['url'],'View item','shoplink')+'</td></tr>' for o in g['items'])
            body='<div class="crumb">'+self.link('/merch/','Merchandise')+' / '+esc(g['design'])+'</div><section class="detail"><div><img class="product" src="'+esc(optimized(g['image'],800,950))+'" alt="'+esc(g['design']+' on '+first['type'])+'"></div><div><div class="kicker">Urban Clothes Market · '+str(len(g['items']))+' Spreadshirt products</div><h1>'+esc(g['design'])+'</h1><p class="lede">'+esc(g['description'])+'</p>'+buy(first['url'],'Shop '+first['type'])+'<p class="muted">Pictured on '+esc(first['type'])+'. Spreadshirt shows the available options, size chart and checkout for this item.</p></div></section>'
            body+=self.shelf('Available styles','<label>Find a product type<br><input class="filterinput" data-variant-filter type="search" placeholder="Hoodie, shirt, mug, sticker…"></label><p class="muted" data-matches>'+str(len(g['items']))+' matching styles</p><table class="table"><thead><tr><th>Product</th><th>Category</th><th>USD</th><th>Spreadshirt</th></tr></thead><tbody>'+rows+'</tbody></table>')
            associated={r['id'] for r in self.related if r.get('design')==g['id']}
            dv=[v for v in self.archive if v['id'] in associated]
            if dv:body+=self.shelf('Watch the design in detail','<div class="videos">'+''.join(self.videoc(v) for v in dv)+'</div>')
            self.page(path,g['design'],g['description'],body,meta_obj('CollectionPage',name=g['design'],url=ORIGINS['urban']+path),canonical=ORIGINS['urban']+path,img=g['image'])
        for g in ordered:
            for o in g['items']:
                if o['sku'] not in self.detail_items:continue
                path=self.itempath(o);name=g['design']+' '+o['type'];pic=o.get('image') or g['image'];gp='/merch/design/'+g['slug']+'/';dk=dept(o['type'])
                body='<div class="crumb">'+self.link('/merch/','Merchandise')+' / '+self.link('/merch/'+dk+'/',_DEPT_LABELS.get(dk,dk))+' / '+self.link(gp,g['design'])+'</div><section class="detail"><div><img class="product" src="'+esc(optimized(pic,850,950))+'" alt="'+esc(name)+'"></div><div><div class="kicker">'+esc(o['type'])+'</div><h1>'+esc(g['design'])+'</h1><p class="lede">'+esc(g['description'])+'</p><p class="itemprice">$'+esc(o['price'])+' USD</p>'+buy(o['url'],'Choose options on Spreadshirt')+'<p class="muted">Spreadshirt shows the options, shipping and final price for this item before checkout.</p>'+self.link(gp,'All '+str(len(g['items']))+' styles for this design')+'</div></section>'
                data=meta_obj('Product',name=name,sku=o['sku'],description=g['description'] or name,image=[pic],url=ORIGINS['urban']+path,brand={'@type':'Brand','name':'Urban Clothes Market'},offers={'@type':'Offer','price':o['price'],'priceCurrency':'USD','url':o['url'],'availability':'https://schema.org/InStock','seller':{'@type':'Organization','name':'Spreadshirt'}})
                self.page(path,name,name+'. '+(g['description'] or 'Original graphic design by Urban Clothes Market.'),body,data,canonical=ORIGINS['urban']+path,img=pic)
        self.page('/books/','Books by Jason Coleman','Explore the complete collection shown on Jason Coleman’s Amazon author page, including novels, nonfiction and graphic novels.',self.heading('Books by Jason Coleman','Fantasy, science fiction, espionage and nonfiction. Select a title to find its available Amazon editions.')+self.cards(self.books,self.bookcard),canonical=ORIGINS['jason']+'/books/')
        for b in self.books:
            path='/books/'+b['slug']+'/';self.search.append([b['title'],'Book',self.url(path),b['genre']+' '+b.get('series','')+' '+b['retailTitle']])
            btns=''.join(buy(amz(f['asin']),f['format']+' on Amazon') for f in b['formats'])
            body='<div class="crumb">'+self.link('/books/','Books')+' / Jason Coleman</div><section class="detail"><div><img class="product bookcover" src="'+esc(b['image'])+'" alt="'+esc(b['title']+' cover')+'"></div><div><div class="kicker">'+esc(b['genre'])+'</div><h1>'+esc(b['title'])+'</h1><p class="muted">By Jason Coleman</p><p class="lede">'+esc(b['desc'])+'</p><div class="bookgroup">'+btns+'</div><p class="muted">Amazon displays the current price and availability for each edition.</p></div></section>'
            vids=[v for v in self.archive if any(r['id']==v['id'] and r.get('book')==b['slug'] for r in self.related)]
            if vids:body+=self.shelf('Watch the story','<div class="videos">'+''.join(self.videoc(v) for v in vids)+'</div>')
            data=meta_obj('Book',name=b['retailTitle'],author={'@type':'Person','name':'Jason Coleman'},image=b['image'],url=ORIGINS['jason']+path,workExample=[{'@type':'Book','name':f['format']+' edition','url':amz(f['asin'])} for f in b['formats']])
            self.page(path,b['title'],b['desc'] or (b['retailTitle']+' by Jason Coleman.'),body,data,canonical=ORIGINS['jason']+path,img=b['image'])
        self.page('/orders/','Order help','Find the seller that handled your book or merchandise order.',self.heading('Order help')+'<section class="guidecopy"><h2>Merchandise from Spreadshirt</h2><p class="lede">Open the order confirmation from Spreadshirt for shipment details and the order number. Spreadshirt’s help center handles questions about its products, orders and returns.</p>'+buy('https://service.spreadshirt.com/','Spreadshirt help','shoplink')+'<h2>Books from Amazon</h2><p class="lede">For a Kindle, print or audiobook purchase, use the Amazon account that placed the order. Amazon shows order status and the available support options there.</p>'+buy('https://www.amazon.com/gp/css/order-history','Amazon orders','shoplink')+'</section>')
        self.page('/privacy/','Privacy and external services','How this site handles browsing and external checkout.',self.heading('Privacy and external services')+'<p class="lede">This catalog links to Amazon and Spreadshirt for purchases. Payment information and shipping addresses are entered on the seller’s website. The storefront uses Google Analytics to measure visits and outbound clicks. Product images may load from the seller. Watch pages embed YouTube using its privacy-enhanced player. Those services receive the browser requests needed to display their content.</p>')
        self.build_video()
        sf=(
            f'<form class="searchform" role="search">'
            f'<input type="search" name="q" aria-label="Search catalog" placeholder="Search all {len(self.skus):,} products, designs, books, or videos">'
            f'<button class="btn">Search</button></form>'
            f'<div class="filters" data-search-tabs>'
            f'<button type="button" class="pill current" data-tab="all">All results</button>'
            f'<button type="button" class="pill" data-tab="products">All {len(self.skus):,} Products</button>'
            f'<button type="button" class="pill" data-tab="Design">Designs ({len(self.designs)})</button>'
            f'<button type="button" class="pill" data-tab="Book">Books ({len(self.books)})</button>'
            f'<button type="button" class="pill" data-tab="Video">Videos & Shorts ({len(self.archive):,})</button>'
            f'</div>'
            f'<p class="muted" data-search-status></p>'
            f'<div data-search-results data-index="{self.url("/assets/search.json")}" data-products-index="{self.url("/assets/products-index.json")}" data-design-base="{self.url("/merch/design/")}" data-item-base="{self.url("/merch/item/")}"></div>'
            f'<div class="actions" style="margin-top:20px"><button class="btn" data-search-more hidden>Show more results</button></div>'
        )
        self.page('/search/','Search the catalog',f'Search all {len(self.skus):,} Spreadshirt products, original designs, Jason Coleman books, and YouTube videos.',self.heading('Search the catalog',f'Instant search across all {len(self.skus):,} verified Spreadshirt products, {len(self.designs)} designs, books, and videos.')+sf,index=False)
        self.write('/assets/search.json',compact(self.search))
        self.write('/assets/videos.json',compact([[v['id'],v['title'],v['kind']] for v in self.archive]))
        self.page('/404.html','Page unavailable','Browse the current collection.',self.heading('Page unavailable','This address does not match a current listing.')+'<div class="actions">'+self.link('/merch/','Browse merchandise','btn')+self.link('/books/','Browse books','btn')+'</div>',index=False)
        self.flush_pages()
        self.write('/robots.txt',('User-agent: *\nDisallow: /\n' if self.preview else 'User-agent: *\nAllow: /\nSitemap: '+self.host+'/sitemap.xml\n'))
        if self.target=='jason' and not self.preview:
            self.write('/robots.txt','User-agent: *\nAllow: /\nSitemap: '+self.host+'/sitemap.xml\nSitemap: '+self.host+'/video-sitemap.xml\n')
        unique_urls=sorted(set(self.urls))
        if len(unique_urls)<=48000:
            self.write('/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+xml_escape(u)+'</loc></url>' for u in unique_urls)+'</urlset>')
        else:
            sm_parts=batches(unique_urls,45000);sm_idx=[]
            for idx,chunk in enumerate(sm_parts,1):
                fname=f'/sitemap-catalog-{idx}.xml'
                self.write(fname,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+xml_escape(u)+'</loc></url>' for u in chunk)+'</urlset>')
                sm_idx.append('<sitemap><loc>'+xml_escape(self.host+fname)+'</loc></sitemap>')
            self.write('/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(sm_idx)+'</sitemapindex>')
        self.write('/release.json',json.dumps({'domain':urlsplit(self.host).hostname,'catalogSha256':self.verification['catalogSha256'],'merchandise':len(self.skus),'designs':len(self.designs),'books':len(self.books),'amazonEditions':sum(len(b['formats']) for b in self.books),'youtubeUploads':len(self.archive)},indent=2))
        self.write('/.nojekyll',''); print(self.target,dict(self.counts),'indexable URLs',len(unique_urls),flush=True)
    def build_video(self):
        groups=[('','Videos and Shorts',self.archive),('videos','Videos',[v for v in self.archive if v['kind']=='videos']),('shorts','YouTube Shorts',[v for v in self.archive if v['kind']=='shorts']),('streams','Livestreams',[v for v in self.archive if v['kind']=='streams'])]
        chips='<nav class="filters" aria-label="Video formats">'+''.join(self.link('/watch/'+(k+'/' if k else ''),t,'pill') for k,t,vs in groups if vs)+'</nav>'
        for key,title,vs in groups:
            if not vs:continue
            base='/watch/'+(key+'/' if key else '');pages=batches(vs,24)
            for i,arr in enumerate(pages,1):
                path=base if i==1 else base+'page/'+str(i)+'/';body=self.heading(title,'The public Jason TV channel archive. Open a title to watch on this site or on YouTube.')+chips+'<div class="videos">'+''.join(self.videoc(v) for v in arr)+'</div>'+self.pager(base,i,len(pages))
                self.page(path,title+(f' · Page {i}' if i>1 else ''),'Browse '+title.lower()+' from Jason TV.',body,canonical=ORIGINS['jason']+path,index=(i==1))
        if self.target=='jason':
            entries=[]
            for v in self.archive:
                if not v.get('date') or not v.get('desc') or v.get('embeddable') is False:continue
                vid=v['id'];loc=self.host+'/watch/'+vid+'/'
                entries.append('<url><loc>'+xml_escape(loc)+'</loc><video:video><video:thumbnail_loc>'+xml_escape(video_image(vid))+'</video:thumbnail_loc><video:title>'+xml_escape(v['title'])+'</video:title><video:description>'+xml_escape(v['desc'])+'</video:description><video:player_loc>https://www.youtube-nocookie.com/embed/'+vid+'</video:player_loc><video:publication_date>'+xml_escape(v['date'])+'</video:publication_date></video:video></url>')
            self.write('/video-sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">'+''.join(entries)+'</urlset>')
        for v in self.archive:
            id=v['id'];p='/watch/'+id+'/';u='https://www.youtube.com/'+('shorts/'+id if v['kind']=='shorts' else 'watch?v='+id);self.search.append([v['title'],'Short' if v['kind']=='shorts' else 'Video',self.url(p),'Jason TV '+v.get('kind','')])
            body='<div class="crumb">'+self.link('/watch/','Jason TV videos')+'</div>'+self.heading(v['title'])+'<iframe class="player" title="'+esc(v['title'])+'" src="https://www.youtube-nocookie.com/embed/'+id+'" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><div class="actions">'+buy(u,'Watch on YouTube','shoplink')+buy(self.channel,'Jason TV channel','shoplink')+'</div>'
            related=next((r for r in self.related if r['id']==id),None)
            if related and related.get('book') in self.bybook:body+=self.shelf('Read the book',self.cards([self.bybook[related['book']]],self.bookcard))
            if related and related.get('design') in self.desmap:body+=self.shelf('Shop the design',self.cards([self.desmap[related['design']]],self.designcard))
            desc=v.get('desc') or v['title']+' on Jason TV.';body+='<p class="lede">'+esc(desc)+'</p>' if v.get('desc') else ''
            ld=meta_obj('VideoObject',name=v['title'],description=first_sentence(desc),thumbnailUrl=[video_image(id)],embedUrl='https://www.youtube-nocookie.com/embed/'+id)
            if v.get('date'):ld['uploadDate']=v['date']
            if v.get('seconds'):ld['duration']='PT'+str(int(v['seconds']))+'S'
            if v.get('embeddable') is False:
                body=re.sub(r'<iframe.*?</iframe>','<p class="lede">This upload is available to watch on YouTube.</p>',body,count=1,flags=re.S)
            self.page(p,v['title'],desc,body,ld if v.get('date') and v.get('embeddable') is not False else None,canonical=ORIGINS['jason']+p,img=video_image(id))
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--target',choices=list(ORIGINS),required=True);parser.add_argument('--out',required=True);parser.add_argument('--prefix',default='');parser.add_argument('--preview',action='store_true');parser.add_argument('--legacy',help='Previous production repository for ad routes and verification files')
    a=parser.parse_args();store=Store(a.target,a.out,a.prefix,a.preview);store.build()
    if a.legacy:
        from legacy import install
        from feeds import write_feeds
        install(store,a.legacy);store.flush_pages();write_feeds(store,a.legacy)
