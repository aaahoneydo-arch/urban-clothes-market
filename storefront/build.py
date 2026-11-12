"""Build one static storefront from the shared checked catalog. Python standard library only."""
import argparse, collections, gzip, hashlib, html, json, math, os, re, shutil
from pathlib import Path
from urllib.parse import urlencode,urlsplit,parse_qs
from xml.sax.saxutils import escape as xml_escape
SRC=Path(__file__).resolve().parent
ORIGINS={'urban':'https://urbanclothesmarket.com','jason':'https://jasontvmarketplace.com'}
NAMES={'urban':'Urban Clothes Market','jason':'Jason TV Marketplace'}
DEPTS=[('hoodies','Hoodies & sweatshirts',r'hoodie|hooded|sweatshirt|fleece|pullover'),('tees','T-shirts & tops',r't-shirt|tee\b|shirt|polo|tank|jersey'),('kids','Kids & baby',r'kid|toddler|baby|babies|youth'),('accessories','Bags, hats & accessories',r'bag|hat|cap\b|beanie|pouch|backpack|tote|keychain|bandana'),('home','Home & gifts',r'mug|cup|bottle|sticker|magnet|pillow|ornament|apron|poster|notebook|mouse|blanket|glass|case|towel'),('other','More styles',r'.')]
esc=lambda s:html.escape(str(s),quote=True)
def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
def slug(v):return re.sub(r'[^a-z0-9]+','-',str(v).lower()).strip('-')[:75]
def first_sentence(s,lim=168):
    s=' '.join(str(s or '').split());return s if len(s)<=lim else s[:lim-1].rsplit(' ',1)[0]+'.'
def dept(s):
    if re.search('kid|toddler|baby|babies|youth',s,re.I):return 'kids'
    return next(d for d,_,p in DEPTS if re.search(p,s,re.I))
def amz(asin):
    if not re.fullmatch('[A-Z0-9]{10}',asin):raise ValueError('Invalid book identifier')
    return 'https://www.amazon.com/dp/'+asin
def buy(url,label,css='btn'):return '<a class="'+css+'" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(label)+' ↗</a>'
def picture(url,alt,early=False):
    return '<img src="'+esc(url)+'" alt="'+esc(alt)+'" loading="'+('eager' if early else 'lazy')+'" decoding="async"'+(' fetchpriority="high"' if early else '')+'>'
def optimized(url,w,h):
    u=urlsplit(url)
    if u.hostname!='image.spreadshirtmedia.com':return url
    q=parse_qs(u.query);q['width']=[str(w)];q['height']=[str(h)]
    return u._replace(query=urlencode(q,doseq=True)).geturl()
def batches(xs,n):return [xs[i:i+n] for i in range(0,len(xs),n)] or [[]]
def video_image(id):return 'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'
def readgzip(f):return json.loads(gzip.decompress(f.read_bytes()))
def meta_obj(kind,**attrs):return {'@context':'https://schema.org','@type':kind,**attrs}
class Store:
    def __init__(self,target,destination,prefix='',preview=False):
        self.target=target;self.out=Path(destination);self.prefix='/'+prefix.strip('/') if prefix.strip('/') else ''
        self.preview=preview;self.name=NAMES[target];self.host=ORIGINS[target];self.urls=[];self.search=[];self.counts=collections.Counter()
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
        p=self.out/path.lstrip('/');p=p/'index.html' if path.endswith('/') else p;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(body,encoding='utf-8')
    def link(self,path,text,cl='textlink'):return f'<a class="{cl}" href="{esc(self.url(path))}">{esc(text)}</a>'
    def page(self,path,title,desc,content,structured=None,canonical=None,index=True,img=None):
        canonical=canonical or self.host+path
        if index and canonical==self.host+path:self.urls.append(canonical)
        kind=self.target
        word=('<span class="mark">UC</span><span>Urban Clothes<br><small>Market</small></span>' if kind=='urban' else '<span class="mark">JC</span><span>Jason TV<br><small>Marketplace</small></span>')
        nav=''.join(self.link(h,t,'') for h,t in ([('/merch/','Merchandise'),('/books/','Books'),('/watch/','Watch')] if kind=='urban' else [('/books/','Books'),('/merch/','Merchandise'),('/watch/','Watch')]))
        ld='' if not structured else '<script type="application/ld+json">'+compact(structured).replace('<','\\u003c')+'</script>'
        robots='noindex,follow' if self.preview or not index else 'index,follow,max-image-preview:large'
        ga=self.metadata.get('ga')
        tracking=(''.join(self.metadata.get('verify',[])) + ('<script async src="https://www.googletagmanager.com/gtag/js?id='+ga+'"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","'+ga+'");</script>' if ga else '')) if not self.preview else ''
        body=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="{self.base(path)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} | {esc(self.name)}</title><meta name="description" content="{esc(first_sentence(desc,175))}"><meta name="robots" content="{robots}"><link rel="canonical" href="{esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(first_sentence(desc))}"><meta property="og:url" content="{esc(canonical)}">{('<meta property="og:image" content="'+esc(img)+'">') if img else ''}<link rel="stylesheet" href="{self.url('/assets/shop.css')}"><script defer src="{self.url('/assets/shop.js')}"></script>{ld}{tracking}</head><body class="{kind}"><a class="skip" href="{self.url(path)}#main">Skip to content</a><header class="top"><div class="frame nav"><a class="wordmark" href="{self.url('/')}" aria-label="{esc(self.name)} home">{word}</a><nav class="navlinks" aria-label="Primary">{nav}{self.link('/search/','Search','searchlink')}</nav></div></header><main id="main" class="frame">{content}</main><footer class="foot"><div class="frame"><p><strong>{esc(self.name)}</strong><br>Merchandise orders through Spreadshirt. Book orders through Amazon.</p><div class="lowernav">{self.link('/merch/','Browse merchandise')}{self.link('/books/','Browse books')}{self.link('/watch/','Videos and Shorts')}{self.link('/orders/','Order help')}{self.link('/privacy/','Privacy')}</div></div></footer></body></html>'''
        self.write(path,body);self.counts['pages']+=1
    def heading(self,title,desc=''):return '<header class="pagehead"><h1>'+esc(title)+'</h1>'+('<p>'+esc(desc)+'</p>' if desc else '')+'</header>'
    def shelf(self,title,body,path=None,action=None,klass=''):
        return '<section class="shelf '+klass+'"><div class="shelf-head"><h2>'+esc(title)+'</h2>'+(self.link(path,action) if path else '')+'</div>'+body+'</section>'
    def itempath(self,item):return '/merch/item/'+item['sku'].removeprefix('spreadshop-')+'/'
    def designcard(self,g,override=None):
        v=override or g['items'][0];url='/merch/design/'+g['slug']+'/'
        # The photograph always identifies the primary item; other types have their own labeled offers.
        image=picture(optimized(g['image'],560,700),g['design']+' on '+g['items'][0]['type']) if g['image'] else '<span class="unpictured">'+esc(g['design'])+'</span>'
        if override and override['sku']!=g['primary'] and not override.get('image'):
            return '<article class="card stylecard"><div class="tag">'+esc(dept(override['type']))+'</div><h3>'+self.link(url,g['design'],'')+'</h3><p>'+esc(override['type'])+'</p><p class="card-amount">$'+esc(override['price'])+' USD</p>'+buy(override['url'],'Shop exact item','shoplink')+'</article>'
        if override and override.get('image'):image=picture(optimized(override['image'],560,700),g['design']+' on '+override['type'])
        return '<article class="card"><a class="picture" href="'+esc(v['url'])+'" target="_blank" rel="noopener" aria-label="Shop '+esc(g['design']+' '+v['type'])+' on Spreadshirt">'+image+'</a><div class="tag">'+esc(v['type'])+'</div><h3>'+self.link(url,g['design'],'')+'</h3><p>'+str(len(g['items']))+(' verified style' if len(g['items'])==1 else ' verified styles')+'</p>'+'<p class="card-amount">$'+esc(v['price'])+' USD</p>'+buy(v['url'],'Shop '+v['type'],'shoplink')+'</article>'
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
    def home(self):
        bytitle=lambda s:next((b for b in self.books if s.lower() in b['title'].lower()),self.books[0])
        books=[bytitle(s) for s in ['The Shattered Crown','A Beautiful Alibi','The People We Carry','A House Beneath The Ash']]
        g=next((d for d in self.designs if d['id']=='328187cff306452c'),self.designs[0]);h=g['items'][0];b=books[0]
        merch=[g];themes=['Kitsune','Direwolves','Gargoyle','Dragon','Lion','Raven','Rose']
        for theme in themes:
            found=next((d for d in self.designs if d not in merch and theme.lower() in d['design'].lower() and len(d['items'])>9),None)
            if found:merch.append(found)
        for d in sorted(self.designs,key=lambda d:-len(d['items'])):
            if len(merch)>=8:break
            if d not in merch:merch.append(d)
        if self.target=='urban':
            title='Graphic clothing, gothic streetwear and original books'
            hero='<div class="kicker">Featured design</div><h1>Self Made<br>in flames.</h1><p>A crowned phoenix rises over a forge anvil. Explore the hoodie and the other styles carrying this design.</p><div class="actions">'+buy(h['url'],'Shop the hoodie')+self.link('/merch/design/'+g['slug']+'/','See all styles')+'</div>'
            art=picture(optimized(g['image'],850,950),g['design']+' on '+h['type'],True)+'<div class="hero-caption"><span>'+esc(h['type'])+'</span><b>$'+esc(h['price'])+'</b></div>'
        else:
            title='Books by Jason Coleman, original merchandise and videos'
            hero='<div class="kicker">Jason Coleman · Fantasy</div><h1>The Shattered<br>Crown</h1><p>Kaia Blackwood, a blacksmith’s daughter, lives in the shadow of the Cinderpeak Mountains. When the Crown Shards break, ancient wraiths awaken.</p><div class="actions">'+buy(amz(b['asin']),'Read on Amazon')+self.link('/books/'+b['slug']+'/','Explore the book')+'</div>'
            art=picture(b['image'],'The Shattered Crown by Jason Coleman',True)
        sections=[self.shelf('Featured designs',self.cards(merch[:8],self.designcard),'/merch/','All merchandise →'),self.shelf('Books by Jason Coleman',self.cards(books,self.bookcard),'/books/','All books →','bookstrip')]
        if self.target=='jason':sections=[self.shelf('Explore the books',self.cards(books,self.bookcard),'/books/','All books →'),self.shelf('From Urban Clothes Market',self.cards(merch[:4],self.designcard),'/merch/','All merchandise →')]
        featured=self.archive[:3]
        shorts=[v for v in self.archive if v['kind']=='shorts'][:3]
        videos=self.shelf('Videos from Jason TV','<div class="videos">'+''.join(self.videoc(v) for v in featured)+'</div>','/watch/','Full video archive →')
        if shorts:videos+=self.shelf('YouTube Shorts','<div class="videos">'+''.join(self.videoc(v) for v in shorts)+'</div>','/watch/shorts/','All Shorts →')
        videos+='<section class="archive-browser" data-archive data-index="'+self.url('/assets/videos.json')+'" data-watch="'+self.url('/watch/')+'"><h3>Explore the full channel</h3><div class="archive-controls"><label>Format <select aria-label="Video format"><option value="">All uploads</option><option value="videos">Videos</option><option value="shorts">Shorts</option><option value="streams">Livestreams</option></select></label><input aria-label="Search channel videos" type="search" placeholder="Search video titles"><button class="btn" data-load>Browse all '+format(len(self.archive),',')+' uploads</button></div><div class="videos" data-archive-list></div><div class="pages" data-archive-nav hidden><button class="pill" data-back>Previous</button><span aria-live="polite" data-archive-status></span><button class="pill" data-next>Next</button></div></section>'
        self.page('/',title,'Shop original Urban Clothes Market designs and Jason Coleman books. Choose a real product or edition, then order directly through Spreadshirt or Amazon.','<section class="hero"><div class="hero-copy">'+hero+'</div><div class="hero-art">'+art+'</div></section>'+''.join(sections)+videos+self.guide(),meta_obj('WebSite',name=self.name,url=self.host+'/'),img=(g['image'] if self.target=='urban' else b['image']))
    def guide(self):
        L=self.link
        if self.target=='urban':
            parts=[('Finding a graphic that works on the garment','A crowned phoenix framed by dark roses reads differently on a hoodie than on a mug. Start with the artwork in '+L('/merch/','the design catalog')+', then open its style list. Every listed variation names the actual garment or accessory and links to that item on Spreadshirt. A design with a hoodie available may have a different set of shirts or accessories from the design beside it.'),
                   ('Gothic streetwear, crests and animal artwork','Look for the details that distinguish each illustration. The Self Made phoenix stands over a blacksmith’s anvil. The Family direwolves guard a silver tree, while the New York gargoyle collection draws on stone cathedral sculpture. Browse by design to compare the artwork, or use the '+L('/merch/hoodies/','hoodie collection')+' to find garments first.'),
                   ('Choosing sizes, colors and gifts','A men’s premium hoodie, a unisex shirt and a youth garment have different measurements. Open the seller’s exact product page to compare its size chart and choose an available color. For gifts that do not need a clothing size, browse '+L('/merch/home/','home goods and accessories')+' for the product types available in the current collection.'),
                   ('Books beyond the clothing collection','Jason Coleman also writes fantasy, science fiction, espionage and nonfiction. '+L('/books/','Browse the books')+' to compare the available Kindle, print and audiobook editions. Where a title has a trailer or narrated graphic novel, the book page links to the matching video below the purchase options.')]
        else:
            parts=[('Where to start with Jason Coleman’s fiction','For fantasy, The Shattered Crown follows Kaia Blackwood and the broken Crown Shards. A Beautiful Alibi opens Mara Voss’s espionage story. For post-apocalyptic fiction, start Dixon’s Journal with A House Beneath the Ash. The '+L('/books/','book catalog')+' shows the title and edition on Amazon, making it easier to start with the first volume or find the next installment.'),
                   ('Science fiction, vampires and graphic novels','The People We Carry opens The Andromeda War. The TIFF series begins with I AM. Draevan’s vampire novels and his graphic novel adaptation have distinct Amazon listings. Open a book page to see its cover and the editions Amazon lists for it. The '+L('/watch/','video archive')+' includes matching narrated comics and trailers alongside the rest of the channel.'),
                   ('Nonfiction by subject','Readers interested in politics can find The Deception Habit and Old Men Start Wars That Young Men Die In. How Matter Became Conscious explores consciousness, while The World We Leave Each Other takes up dignity and responsibility. Each book has its own page so readers searching by title or subject can reach the correct Amazon edition.'),
                   ('Original graphic apparel and gifts','The '+L('/merch/','Urban Clothes Market collection')+' brings together gothic crests, animal artwork and original illustrated designs. Browse a design’s actual product types, from graphic shirts and hoodies to gifts. A merchandise purchase opens the matching Spreadshirt item with its options. Books open on Amazon, and both sellers show checkout and delivery details before purchase.')]

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
                ('Search the shelves by subject','A search for a gothic phoenix, Japanese fox artwork, an original vampire graphic novel or a book about consciousness can start in the '+self.link('/search/','site search')+'. Results distinguish a design, a book and a video. Choose a merchandise design for its available products, a book for its published editions, or a video to watch on Jason TV.')])
        return '<section class="guidecopy"><h2>'+('A guide to the collection' if self.target=='urban' else 'Explore Jason Coleman’s books and work')+'</h2><div class="guidecolumns">'+''.join('<section><h3>'+esc(t)+'</h3><p>'+d+'</p></section>' for t,d in parts)+'</div></section>'
    def build(self):
        self.out.mkdir(parents=True,exist_ok=True);(self.out/'assets').mkdir(exist_ok=True)
        shutil.copy2(SRC/'site.css',self.out/'assets/shop.css');shutil.copy2(SRC/'site.js',self.out/'assets/shop.js')
        if (SRC/'fonts').is_dir():shutil.copytree(SRC/'fonts',self.out/'assets/fonts',dirs_exist_ok=True)
        self.home()
        chips='<nav class="filters" aria-label="Browse by product type">'+self.link('/merch/','All designs','pill')+''.join(self.link('/merch/'+k+'/',t,'pill') for k,t,p in DEPTS if any(any(dept(o['type'])==k for o in g['items']) for g in self.designs))+'</nav>'
        ordered=sorted(self.designs,key=lambda x:(-len(x['items']),x['design'].lower()))
        for key,label,_ in [('','Graphic merchandise',''),*DEPTS]:
            pairs=[]
            for g in ordered:
                if key:
                    pairs.extend((g,o) for o in g['items'] if dept(o['type'])==key)
                else:pairs.append((g,g['items'][0]))
            if key:pairs.sort(key=lambda pair:(pair[1]['sku'] not in self.detail_items,pair[1]['sku']!=pair[0]['primary'],pair[0]['design'],pair[1]['type']))
            if not pairs:continue
            base='/merch/'+(key+'/' if key else '');pages=batches(pairs,24)
            for i,items in enumerate(pages,1):
                path=base if i==1 else base+'page/'+str(i)+'/'
                # Always label the pictured primary item; the department link below the card identifies its own variant.
                content=self.heading(label,'Choose a design to compare its available styles, or open the named item directly on Spreadshirt.')+chips+self.cards(items,lambda z:self.designcard(z[0],z[1]))+self.pager(base,i,len(pages))
                canonical=(ORIGINS['urban']+path) if self.target=='jason' else None
                self.page(path,label+(f' · Page {i}' if i>1 else ''),'Browse '+label.lower()+' from Urban Clothes Market, with direct links to each seller product.',content,canonical=canonical)
        for g in ordered:
            first=g['items'][0];path='/merch/design/'+g['slug']+'/'
            self.search.append([g['design'],'Design',self.url(path),' '.join(dict.fromkeys(o['type'] for o in g['items']))])
            rows=''.join('<tr data-variant="'+esc(o['type'].lower())+'"><td>'+(self.link(self.itempath(o),o['type'],'shoplink') if o['sku'] in self.detail_items else esc(o['type']))+'</td><td>$'+esc(o['price'])+'</td><td>'+buy(o['url'],'View item','shoplink')+'</td></tr>' for o in g['items'])
            body='<div class="crumb">'+self.link('/merch/','Merchandise')+' / '+esc(g['design'])+'</div><section class="detail"><div><img class="product" src="'+esc(optimized(g['image'],800,950))+'" alt="'+esc(g['design']+' on '+first['type'])+'"></div><div><div class="kicker">Urban Clothes Market</div><h1>'+esc(g['design'])+'</h1><p class="lede">'+esc(g['description'])+'</p>'+buy(first['url'],'Shop '+first['type'])+'<p class="muted">Pictured on '+esc(first['type'])+'. Spreadshirt shows the available options for this item.</p></div></section>'
            body+=self.shelf('Available styles','<label>Find a product type<br><input class="filterinput" data-variant-filter type="search" placeholder="Hoodie, shirt, mug…"></label><p class="muted" data-matches>'+str(len(g['items']))+' matching styles</p><table class="table"><thead><tr><th>Product</th><th>USD</th><th>Spreadshirt</th></tr></thead><tbody>'+rows+'</tbody></table>')
            associated={r['id'] for r in self.related if r.get('design')==g['id']}
            dv=[v for v in self.archive if v['id'] in associated]
            if dv:body+=self.shelf('Watch the design in detail','<div class="videos">'+''.join(self.videoc(v) for v in dv)+'</div>')
            self.page(path,g['design'],g['description'],body,meta_obj('CollectionPage',name=g['design'],url=ORIGINS['urban']+path),canonical=ORIGINS['urban']+path,img=g['image'])
        for g in ordered:
            for o in g['items']:
                if o['sku'] not in self.detail_items:continue
                path=self.itempath(o);name=g['design']+' '+o['type'];pic=o.get('image') or g['image'];gp='/merch/design/'+g['slug']+'/'
                body='<div class="crumb">'+self.link('/merch/','Merchandise')+' / '+self.link(gp,g['design'])+'</div><section class="detail"><div><img class="product" src="'+esc(optimized(pic,850,950))+'" alt="'+esc(name)+'"></div><div><div class="kicker">'+esc(o['type'])+'</div><h1>'+esc(g['design'])+'</h1><p class="lede">'+esc(g['description'])+'</p><p class="itemprice">$'+esc(o['price'])+' USD</p>'+buy(o['url'],'Choose options on Spreadshirt')+'<p class="muted">Spreadshirt shows the options, shipping and final price for this item before checkout.</p>'+self.link(gp,'Other styles for this design')+'</div></section>'
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
        sf='<form class="searchform" role="search"><input type="search" name="q" aria-label="Search catalog" placeholder="Book, design, style, or video"><button class="btn">Search</button></form><p class="muted" data-search-status></p><div data-search-results data-index="'+self.url('/assets/search.json')+'"></div><button class="btn" data-search-more hidden>Show more results</button>'
        self.page('/search/','Search the catalog','Find books, graphic merchandise, YouTube videos, and Shorts.',self.heading('Search the catalog')+sf,index=False)
        self.write('/assets/search.json',compact(self.search))
        self.write('/assets/videos.json',compact([[v['id'],v['title'],v['kind']] for v in self.archive]))
        self.page('/404.html','Page unavailable','Browse the current collection.',self.heading('Page unavailable','This address does not match a current listing.')+'<div class="actions">'+self.link('/merch/','Browse merchandise','btn')+self.link('/books/','Browse books','btn')+'</div>',index=False)
        self.write('/robots.txt',('User-agent: *\nDisallow: /\n' if self.preview else 'User-agent: *\nAllow: /\nSitemap: '+self.host+'/sitemap.xml\n'))
        if self.target=='jason' and not self.preview:
            self.write('/robots.txt','User-agent: *\nAllow: /\nSitemap: '+self.host+'/sitemap.xml\nSitemap: '+self.host+'/video-sitemap.xml\n')
        self.write('/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+xml_escape(u)+'</loc></url>' for u in sorted(set(self.urls)))+'</urlset>')
        self.write('/release.json',json.dumps({'domain':urlsplit(self.host).hostname,'catalogSha256':self.verification['catalogSha256'],'merchandise':len(self.skus),'designs':len(self.designs),'books':len(self.books),'amazonEditions':sum(len(b['formats']) for b in self.books),'youtubeUploads':len(self.archive)},indent=2))
        self.write('/.nojekyll',''); print(self.target,dict(self.counts),'indexable URLs',len(set(self.urls)))
    def build_video(self):
        groups=[('','Videos and Shorts',self.archive),('videos','Videos',[v for v in self.archive if v['kind']=='videos']),('shorts','YouTube Shorts',[v for v in self.archive if v['kind']=='shorts']),('streams','Livestreams',[v for v in self.archive if v['kind']=='streams'])]
        chips='<nav class="filters" aria-label="Video formats">'+''.join(self.link('/watch/'+(k+'/' if k else ''),t,'pill') for k,t,vs in groups if vs)+'</nav>'
        for key,title,vs in groups:
            if not vs:continue
            base='/watch/'+(key+'/' if key else '');pages=batches(vs,24)
            for i,arr in enumerate(pages,1):
                path=base if i==1 else base+'page/'+str(i)+'/';body=self.heading(title,'The public Jason TV channel archive. Open a title to watch on this site or on YouTube.')+chips+'<div class="videos">'+''.join(self.videoc(v) for v in arr)+'</div>'+self.pager(base,i,len(pages))
                self.page(path,title+(f' · Page {i}' if i>1 else ''),'Browse '+title.lower()+' from Jason TV.',body,canonical=ORIGINS['jason']+path)
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
        install(store,a.legacy);write_feeds(store,a.legacy)
