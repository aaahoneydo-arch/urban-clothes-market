import collections, concurrent.futures, datetime, gzip, html, json, os, re, sqlite3, sys, threading, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

def key(s):
    return re.sub(r'[^a-z0-9]+',' ',str(s or '').lower().replace("’","").replace("'","")).strip()

def slug(s):
    return key(s).replace(' ','+')

def first_script(text,pattern):
    m=re.search(pattern,text,re.S|re.I)
    return json.loads(m.group(1)) if m else {}

def spread_info(r):
    p=urllib.parse.urlsplit(r['url'])
    uid=re.search(r'-[AD]([a-zA-Z0-9]+)$',p.path)[1]
    query=urllib.parse.parse_qs(p.query)
    sku=query['sellable'][0]
    url='https://www.spreadshirt.com/shop/design/'+slug(r['design']+' '+r['productType'])+'-D'+uid+'?'+urllib.parse.urlencode({'sellable':sku,'appearance':query['appearance'][0]})
    if p.hostname=='www.spreadshirt.com' and p.path.startswith('/shop/design/'):
        url=r['url']
    return url,uid,sku,query['appearance'][0]

def get_page(url,store):
    req=urllib.request.Request(url,headers={'User-Agent':'UrbanClothesMarket-CatalogAudit/1.0 (+https://urbanclothesmarket.com/)','Accept':'*/*','Accept-Encoding':'gzip'})
    with urllib.request.urlopen(req,timeout=18) as r:
        p=urllib.parse.urlsplit(r.geturl())
        if p.hostname!=urllib.parse.urlsplit(url).hostname: raise ValueError('Redirect to '+str(p.hostname))
        s=r.read(1800000)
        if r.headers.get('Content-Encoding')=='gzip': s=gzip.decompress(s)
        return r.geturl(),s.decode('utf-8','replace')

def verify(r):
    store=r['store'].lower(); orig=r['url']
    result={'id':r['id'],'shop':store,'original':orig,'status':'unverified','checkedOn':datetime.datetime.now(datetime.timezone.utc).date().isoformat()}
    try:
        if store=='spreadshop': url,uid,sku,appearance=spread_info(r)
        else: url=orig
        final,body=get_page(url,store)
        ld=[]
        for block in re.findall(r'<script[^>]*\btype=["\']application/ld\+json["\'][^>]*>(.*?)</script>',body,re.S|re.I):
            try:
                data=json.loads(block)
                objs=data if isinstance(data,list) else data.get('@graph',[data])
                ld.extend(x for x in objs if isinstance(x,dict) and x.get('@type')=='Product')
            except (ValueError,AttributeError,TypeError):pass
        prod=ld[0] if ld else {}
        offers=prod.get('offers',[]); offers=offers if isinstance(offers,list) else [offers]
        offer=next((o for o in offers if 'instock' in str(o.get('availability','')).lower()), offers[0] if offers else {})
        if store=='spreadshop':
            a=first_script(body,r'window\.analytics\.product\s*=\s*(\{[^\n]+?\});')
            if (a.get('designerName')!='Urban Clothes Market' or a.get('articleId')!=uid or a.get('sellableId')!=sku or str(a.get('productTypeId'))!=sku.split('-')[1]):
                raise ValueError('Seller, design or variant mismatch')
            if a.get('stockout') or not a.get('availableSizes') or appearance not in a.get('availableAppearances',[]) or str(a.get('appearanceId'))!=appearance:
                raise ValueError('Requested appearance or sizes unavailable')
            if 'Add to basket' not in body or not offer.get('url') or offer.get('priceCurrency')!='USD' or not str(offer.get('availability','')).endswith('/InStock'):
                raise ValueError('Missing orderable USD offer')
            dest=urllib.parse.urlsplit(offer['url']); query=urllib.parse.parse_qs(dest.query)
            if dest.hostname!='www.spreadshirt.com' or not dest.path.endswith('-D'+uid) or query.get('sellable')!=[sku] or query.get('appearance')!=[appearance]:
                raise ValueError('Offer URL does not identify requested variant')
            title=prod['name'];images=prod.get('image',[]);image=(images[0] if isinstance(images,list) and images else images if isinstance(images,str) else '');result.update(url=offer['url'],title=title,design=a['articleName'],price=offer['price'],currency='USD',image=image,description=prod.get('description',''))
        else:
            can=re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)',body,re.I)
            can=html.unescape(can.group(1)) if can else ''; meta=re.search(r'<meta[^>]*property="og:title"[^>]*content="([^"]+)',body,re.I)
            title=html.unescape(prod.get('name') or (html.unescape(meta[1]) if meta else ''))
            can=can or prod.get('url','')
            if not title or not re.search(r'Add to (cart|basket|bag)',body,re.I):raise ValueError('No product title or purchase control')
            if store=='printify':
                if not can.startswith(orig.rstrip('/')+'/') and can.rstrip('/')!=orig.rstrip('/'):raise ValueError('Incorrect seller product ID')
            elif store=='fourthwall':
                if urllib.parse.urlsplit(can).path.split('/products/')[-1]!=urllib.parse.urlsplit(orig).path.split('/products/')[-1] or 'JasonTV Marketplace' not in str(prod.get('brand')):raise ValueError('Incorrect Fourthwall seller or product')
            elif store=='redbubble':
                if urllib.parse.urlsplit(can).hostname!='www.redbubble.com' or urllib.parse.urlsplit(can).path.split('/')[:-1]!=urllib.parse.urlsplit(orig).path.split('/')[:-1] or 'UrbanClothesMKT' not in orig:raise ValueError('Incorrect Redbubble variant')
            elif store=='teepublic':
                if urllib.parse.urlsplit(can).path!=urllib.parse.urlsplit(orig).path or 'urban-clothes-market' not in body:raise ValueError('Incorrect TeePublic product')
            elif store=='zazzle':
                if can!=orig or 'urbanclothes' not in str(prod.get('brand')).lower().replace(' ',''):raise ValueError('Incorrect Zazzle product or creator')
            expected=set(key(r.get('design') or r.get('name') or r.get('title')).split())
            if not expected or len(expected & set(key(title).split())) < max(1,len(expected)*0.45):
                raise ValueError('Catalog title mismatch')
            if offer.get('availability') and 'instock' not in str(offer['availability']).lower():raise ValueError('Out of stock')
            result.update(url=can if store in ['printify','redbubble'] else orig,title=title)
            if offer.get('priceCurrency')=='USD' and offer.get('price'):result.update(price=offer['price'],currency='USD')
            if store=='printify':
                decoded=body.replace(chr(92)+'"','"')
                if '"initialCurrency":"USD"' in decoded:
                    default=re.search(r'"_default":true,"retailPrice":(\d+)', decoded)
                    if default:result.update(price=f'{int(default[1])/100:.2f}',currency='USD')
        result['status']='verified'
    except urllib.error.HTTPError as e:
        result['status']='http_'+str(e.code)
        if e.code==429:
            until[store]=time.monotonic()+max(60,int(e.headers.get('Retry-After','60')) if e.headers.get('Retry-After','60').isdigit() else 60)
    except Exception as e:result['detail']=str(e)[:180]
    return result
until={}
def work(r):
    shop=r['store'].lower()
    while until.get(shop,0)>time.monotonic():time.sleep(min(10,until[shop]-time.monotonic()))
    return verify(r)
def read_inputs(paths):
    unique={}
    for path in paths:
        for product in json.loads(Path(path).read_text(encoding='utf-8')):
            unique.setdefault(product['id'],product)
    return list(unique.values())

def run():
    import argparse, itertools
    parser=argparse.ArgumentParser(description='Check public product pages against their seller, design, variant and purchase controls.')
    parser.add_argument('--source', action='append',required=True)
    parser.add_argument('--prior',action='append',default=[],help='Existing newline-delimited merchant checks')
    parser.add_argument('--output',required=True)
    parser.add_argument('--start',type=int,default=0)
    parser.add_argument('--stop',type=int,default=None)
    parser.add_argument('--workers',type=int,default=8)
    args=parser.parse_args()
    products=read_inputs(args.source)[args.start:args.stop]
    known=set()
    for path in [*args.prior,args.output]:
        if Path(path).exists():
            for line in Path(path).read_text(encoding='utf-8').splitlines():
                if line.strip():known.add(json.loads(line)['id'])
    pending_rows=iter(p for p in products if p['id'] not in known)
    failures=collections.Counter();observed=collections.Counter();total=0
    workers=max(1,min(args.workers,16))
    with concurrent.futures.ThreadPoolExecutor(workers) as pool, open(args.output,'a',encoding='utf-8',buffering=1) as out:
        pending={pool.submit(work,p) for p in itertools.islice(pending_rows,workers)}
        while pending:
            ready,pending=concurrent.futures.wait(pending,return_when=concurrent.futures.FIRST_COMPLETED)
            for future in ready:
                result=future.result();shop=result['shop'];observed[shop]+=1
                if result['status'] in ['http_403','http_429','http_503']:failures[shop]+=1
                out.write(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n');total+=1
                if total%250==0:print('Checked',total,'additional destinations',flush=True)
                if observed[shop]>=24 and failures[shop]>=observed[shop]*0.9:
                    raise RuntimeError('Merchant blocking most automated requests from this worker: '+shop)
                p=next(pending_rows,None)
                if p is not None:pending.add(pool.submit(work,p))
    print('Checked',total,'additional destinations',flush=True)

if __name__=='__main__':run()
