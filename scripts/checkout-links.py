"""Apply merchant-verified product offers to the two production storefronts.

Run from the repository root with a newline-delimited JSON audit export.
Partial audits update only checked items. The original source rows for items
with a confirmed checkout failure are retained under checkout/withheld.json.
"""
import argparse
import csv
import gzip
import html
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import parse_qs, urlsplit
from xml.etree import ElementTree as ET

MERCHANTS = {
    'spreadshop': {'www.spreadshirt.com'}, 'printify': {'urban-clothes-market.printify.me'},
    'zazzle': {'www.zazzle.com'}, 'redbubble': {'www.redbubble.com'},
    'teepublic': {'www.teepublic.com'}, 'fourthwall': {'jasontv-marketplace-shop.fourthwall.com','shop.jasontvmarketplace.com'}
}
DEAD = {'http_404','http_410'}
HOLD = {'Seller, design or variant mismatch', 'Requested appearance or sizes unavailable',
        'Catalog title mismatch', 'Out of stock','Incorrect Redbubble variant'}
TAG_URL = re.compile(r'https://(?:urbanclothesmarket\.myspreadshop\.com|www\.spreadshirt\.com|urban-clothes-market\.printify\.me|www\.zazzle\.com|www\.redbubble\.com|www\.teepublic\.com|jasontv-marketplace-shop\.fourthwall\.com)/[^"\'<>\s\\]+', re.I)
ARTICLE = re.compile(r'<article\b[^>]*>.*?</article>',re.S|re.I)
LD = re.compile(r'(<script\b[^>]*\btype="application/ld\+json"[^>]*>)(.*?)(</script>)',re.S|re.I)
PRODUCT_PATH = re.compile(r'^(?:https?://(?:www\.)?(?:urbanclothesmarket\.com|jasontvmarketplace\.com))?(/products/[^?#]+?)(?:index\.html)?/?$')
MONEY = re.compile(r'\$[\d,]+(?:\.\d{2})?')
G = '{http://base.google.com/ns/1.0}'

def compact(value):
    return json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False)

def write_text(p,s):
    b=s.encode('utf-8')
    if p.exists():
        previous=p.read_bytes()
        if p.suffix in ('.html','.js','.mjs') and b'\r\n' in previous and b'\r\n' not in b:b=b.replace(b'\n',b'\r\n')
        if previous==b:return
    p.parent.mkdir(parents=True,exist_ok=True)
    tmp=p.with_name(p.name+'.checkout-tmp')
    tmp.write_bytes(b);tmp.replace(p)

def valid(r):
    if r.get('status')!='verified' or not r.get('title'): return False
    u=urlsplit(r['url']); original=urlsplit(r['original']); shop=r['shop']
    if u.scheme!='https' or u.hostname not in MERCHANTS.get(shop,set()) or u.username or u.password or u.path in ('','/'):return False
    if shop=='spreadshop':
        original_id=re.search(r'-[AD]([a-z0-9]+)$',original.path)
        if not original_id or not u.path.startswith('/shop/design/') or not u.path.endswith('-D'+original_id[1]):return False
        before,after=parse_qs(original.query),parse_qs(u.query)
        return all(before.get(k)==after.get(k) and after.get(k) for k in ['sellable','appearance']) and r['id']=='spreadshop-'+after['sellable'][0] and r.get('currency')=='USD'
    if shop=='printify':return re.match(r'^/product/(\d+)(?:/|$)',u.path) is not None and u.path.split('/')[2]==original.path.split('/')[2]
    if shop=='redbubble':return u.path.split('/')[:-1]==original.path.split('/')[:-1] and '/i/' in u.path and 'by-UrbanClothesMKT/' in u.path
    if shop=='fourthwall':return '/products/' in u.path and u.path.split('/products/')[-1]==original.path.split('/products/')[-1]
    return original.hostname==u.hostname and original.path==u.path

def withheld(r):
    return r.get('status') in DEAD or r.get('detail') in HOLD

class Catalog:
    def __init__(self, audit_file):
        self.by_id={}; self.by_url={}; self.by_path={}; self.held={}
        for line in Path(audit_file).read_text().splitlines():
            if not line.strip():continue
            row=json.loads(line)
            if not valid(row) and not withheld(row):continue
            old=self.by_id.get(row['id'])
            if old and valid(old) and not valid(row):continue
            self.by_id[row['id']]=row
            for link in [row['original'],row.get('url')]:
                if link:self.by_url[link]=row
        if not self.by_id:raise ValueError('The audit contains no applicable product IDs')

    def find(self,link):
        link=html.unescape(link)
        if link in self.by_url:return self.by_url[link]
        m=PRODUCT_PATH.fullmatch(link)
        if m:return self.by_path.get(m[1].strip('/'))
        return None

    def update_product(self,item,source=None):
        r=self.by_id.get(item.get('id')) or self.find(item.get('url',''))
        if not r:return item
        if not valid(r):
            if source:self.held.setdefault(r['id'],{})[source]=item
            return None
        current=item.copy()
        current['url']=r['url']
        current['checkoutVerifiedOn']=r.get('checkedOn') or '2026-11-09'
        for field in ['buyUrl','checkoutUrl','purchaseUrl']:
            if field in current:current[field]=r['url']
        if isinstance(current.get('path'),str) and current['path'].startswith('http'):current['path']=r['url']
        for field in ['title','name']:
            if field in current:current[field]=html.unescape(r['title'])
        if r.get('design'):
            current['design']=r['design']
            if r['title'].startswith(r['design']+' '):current['productType']=r['title'][len(r['design'])+1:]
        if r.get('currency')=='USD' and r.get('price') is not None:
            value=float(r['price'])
            for field in ['price','priceNum']:
                if field not in current:continue
                current[field]=value if isinstance(current[field],(int,float)) else f'${value:.2f}'
        if r['shop']=='spreadshop':
            for field in ['storeLabel','storeBadge','cta']:
                if field in current:current[field]=str(current[field]).replace('Spreadshop','Spreadshirt')
        return current

    def substitute_link(self,m):
        raw=m[0];r=self.find(raw)
        if not r or not valid(r):return raw
        return html.escape(r['url'],quote=True) if '&amp;' in raw else r['url']

    def card(self,m):
        block=m[0]
        if not (re.search(r'<article\b[^>]*class="[^"]*\b(?:product-card|real-prod-card)\b',block,re.I) or 'class="launch-buy"' in block):return block
        mid=re.search(r'\bdata-id="([^"]+)"',block)
        row=self.by_id.get(mid[1]) if mid else None
        if not row:
            links=re.findall(r'href="([^"]+)"',block)
            matches={r['id']:r for u in links if (r:=self.find(u))}
            if len(matches)==1:row=next(iter(matches.values()))
        if not row:return block
        if not valid(row):return ''
        for tag in ['h4','h3']:
            block=re.sub(r'(<'+tag+r'[^>]*\bclass="real-prod-title"[^>]*>)[^<]*(</'+tag+'>)',lambda m:m[1]+html.escape(row['title'])+m[2],block)
        if row.get('currency')=='USD' and row.get('price') is not None:
            block=re.sub(r'((?:class="(?:price|real-prod-price-badge|ss-price)")>)[^<]*',lambda m:m[1]+f"${float(row['price']):.2f}",block)
        if row['shop']=='spreadshop':block=block.replace('Buy Now on Spreadshop','Buy now on Spreadshirt')
        return block

    def ld(self,data):
        if isinstance(data,list):return [w for d in data if (w:=self.ld(d)) is not None]
        if not isinstance(data,dict):return data
        if data.get('@type')=='Product':
            r=self.by_id.get(str(data.get('sku','')))
            if not r and isinstance(data.get('offers'),dict):r=self.find(data['offers'].get('url',''))
            if r:
                if not valid(r):return None
                data['name']=r['title']
                offers=data.get('offers',[]); offers=offers if isinstance(offers,list) else [offers]
                for offer in offers:
                    if not isinstance(offer,dict):continue
                    offer['url']=r['url']
                    if r.get('currency')=='USD' and r.get('price') is not None:
                        offer.update(price=f"{float(r['price']):.2f}",priceCurrency='USD')
        for k in list(data):
            if isinstance(data[k],(dict,list)):
                result=self.ld(data[k])
                if result is None:
                    if data.get('@type')=='ListItem' and k=='item':return None
                    del data[k]
                else:data[k]=result
        return data

    def update_html(self,p,s):
        product=self.by_path.get(str(p.parent))
        if product and valid(product) and 'name="withheld-product-id"' in s:
            title=html.escape(product['title']);url=html.escape(product['url'],quote=True)
            return ('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
                    '<title>'+title+'</title><main style="max-width:46em;margin:10vh auto;padding:1.5em;font:1.1rem/1.6 system-ui">'
                    '<h1>'+title+'</h1><p><a href="'+url+'">Buy on the seller’s website</a></p><a href="/">Browse current products</a></main></html>\n')
        if product and not valid(product):
            name=html.escape(product.get('title') or self.original_names.get(product['id'],product['id']))
            return ('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
                    '<meta name="withheld-product-id" content="'+html.escape(product['id'],quote=True)+'"><meta name="robots" content="noindex,follow"><title>'+name+'</title><main style="max-width:46em;margin:10vh auto;padding:1.5em;font:1.1rem/1.6 system-ui">'
                    '<h1>'+name+'</h1><p>This item is currently unavailable from the seller.</p><a href="/">Browse current products</a></main></html>\n')
        s=ARTICLE.sub(self.card,s)
        def embedded(m):
            items=json.loads(m[2]);rows=[v for item in items if (v:=self.update_product(item)) is not None]
            return m[1]+compact(rows).replace('<','\\u003c')+m[3]
        s=re.sub(r'(let (?:REAL_PRODUCTS_DATA|ALL_PRODUCTS) = )(\[.*?\])(;\s*\n)',embedded,s,count=1,flags=re.S)
        def ldscript(m):
            try:v=json.loads(m[2])
            except ValueError:return m[0]
            before=compact(v)
            d=self.ld(v)
            if d is not None and compact(d)==before:return m[0]
            return m[1]+compact(d).replace('<','\\u003c')+m[3] if d else ''
        s=LD.sub(ldscript,s)
        def anchor(m):
            start,u,end,body=m.groups();r=self.find(u)
            if not r:
                parsed=urlsplit(html.unescape(u))
                if parsed.hostname=='urbanclothesmarket.myspreadshop.com' and parsed.path in ('','/','/all'):
                    if re.search(r'buy now|add to (cart|basket)|direct checkout',body,re.I):return '<span aria-disabled="true">Currently unavailable</span>'
                    return start+'/spreadshop.html'+end+body+'</a>'
                return m[0]
            if not valid(r):return '<span aria-disabled="true">'+('Currently unavailable' if re.search(r'buy|checkout',body,re.I) else body)+'</span>'
            if 'Spreadshop' in body and r['shop']=='spreadshop':body=body.replace('Spreadshop','Spreadshirt')
            if r.get('currency')=='USD' and r.get('price') is not None:body=MONEY.sub(lambda _:f"${float(r['price']):.2f}",body)
            return start+html.escape(r['url'],quote=True)+end+body+'</a>'
        s=re.sub(r'(<a\b[^>]*?\bhref=")([^"]+)("[^>]*>)(.*?)</a>',anchor,s,flags=re.S|re.I)
        if product and valid(product) and product.get('price') and product.get('currency')=='USD':
            amount=f"${float(product['price']):.2f}"
            s=re.sub(r'(<div class="pdp-price-amount">)[^<]*',lambda m:m[1]+amount,s)
            s=re.sub(r'(font-size:1\.6rem;font-weight:bold;color:#111;margin:15px 0;">)\$[\d,.]+ USD',lambda m:m[1]+amount+' USD',s)
        return TAG_URL.sub(self.substitute_link,s)

    def repair_sources(self,files):
        holdfile=Path('checkout/withheld.json')
        old=json.loads(holdfile.read_text()) if holdfile.exists() else {}
        self.original_names={}
        for fname in files:
            p=Path(fname)
            if not p.exists():continue
            rows=json.loads(p.read_text()); existing={r.get('id') for r in rows}
            for id,raw in old.items():
                if fname in raw and id not in existing:rows.append(raw[fname])
            fixed=[]
            for row in rows:
                self.original_names[row.get('id')]=row.get('name') or row.get('title')
                v=self.update_product(row,fname)
                if v is not None:fixed.append(v)
            write_text(p,compact(fixed)+'\n')
        merged={k:v for k,v in old.items() if k not in self.by_id or not valid(self.by_id[k])}
        merged.update(self.held)
        if merged:write_text(holdfile,compact(merged)+'\n')

    def index_legacy(self):
        mapfile=Path('checkout/legacy-routes.json')
        saved=json.loads(mapfile.read_text()) if mapfile.exists() else {}
        self.by_path={path:self.by_id[sku] for path,sku in saved.items() if sku in self.by_id}
        for p in Path('products').glob('*/index.html'):
            s=p.read_text()
            for m in LD.finditer(s):
                try:d=json.loads(m[2])
                except ValueError:continue
                if isinstance(d,dict) and d.get('@type')=='Product':
                    r=self.by_id.get(str(d.get('sku','')))
                    if r:
                        self.by_path[str(p.parent)]=r; saved[str(p.parent)]=r['id']
                    break
        if saved:write_text(mapfile,compact(saved)+'\n')

    def feed(self,p):
        zipped=p.suffix=='.gz';data=p.read_bytes();raw=(gzip.decompress(data) if zipped else data).decode('utf-8-sig')
        if '.xml' in p.name:
            def item(m):
                txt=m[0];sku=re.search(r'<g:id>([^<]+)</g:id>',txt)
                r=self.by_id.get(html.unescape(sku[1])) if sku else None
                if not r:return txt
                if not valid(r):return ''
                u=re.search(r'<g:link>([^<]+)</g:link>',txt)
                if u and not PRODUCT_PATH.fullmatch(html.unescape(u[1])):txt=txt.replace(u[0],'<g:link>'+html.escape(r['url'])+'</g:link>',1)
                txt=re.sub(r'<g:title>.*?</g:title>',lambda _:'<g:title>'+html.escape(r['title'])+'</g:title>',txt,count=1,flags=re.S)
                if r.get('price') and r.get('currency')=='USD':txt=re.sub(r'<g:price>.*?</g:price>',lambda _:f"<g:price>{float(r['price']):.2f} USD</g:price>",txt,count=1)
                return txt
            new=re.sub(r'<item>.*?</item>',item,raw,flags=re.S)
        else:
            sep='\t' if '.tsv' in p.name else ','
            reader=csv.DictReader(io.StringIO(raw),delimiter=sep)
            if not reader.fieldnames or not {'id','link'}<=set(reader.fieldnames):return
            buf=io.StringIO(newline='');writer=csv.DictWriter(buf,fieldnames=reader.fieldnames,delimiter=sep,lineterminator='\n');writer.writeheader()
            for a in reader:
                r=self.by_id.get(a['id'])
                if r:
                    if not valid(r):continue
                    if not PRODUCT_PATH.fullmatch(a['link']):a['link']=r['url']
                    if 'title' in a:a['title']=r['title']
                    if 'price' in a and r.get('price') and r.get('currency')=='USD':a['price']=f"{float(r['price']):.2f} USD"
                writer.writerow(a)
            new=buf.getvalue()
        if new!=raw:p.write_bytes(gzip.compress(new.encode(),mtime=0) if zipped else new.encode())

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('audit');args=parser.parse_args()
    host=Path('CNAME').read_text().strip()
    if host not in ['urbanclothesmarket.com','jasontvmarketplace.com']:sys.exit('Expected a production storefront checkout.')
    urban=host=='urbanclothesmarket.com'; cat=Catalog(args.audit)
    files=['data/catalog.json','data/catalog-additions.json','data/gothic-launch-verified.json'] if urban else ['real_products_catalog.json','shop/products-catalog.json','catalog-additions.json']
    cat.index_legacy();cat.repair_sources(files)
    # The shard files maintain their existing indices. Remove held IDs from the compact search index.
    if urban:
        for p in Path('catalog/shards').glob('*.json'):
            rows=json.loads(p.read_text());write_text(p,compact([v for x in rows if (v:=cat.update_product(x)) is not None])+'\n')
        ip=Path('catalog/index.json');idx=json.loads(ip.read_text());kept=[]
        def intern(a,s,lookup):
            if s not in lookup:lookup[s]=len(a);a.append(s)
            return lookup[s]
        designs={s:i for i,s in enumerate(idx['designs'])};types={s:i for i,s in enumerate(idx['productTypes'])}
        for row in idx['rows']:
            r=cat.by_id.get(row[0])
            if r and not valid(r):continue
            if r and r.get('price') and r.get('currency')=='USD':row[3]=float(r['price'])
            if r and r.get('design'):
                row[1]=intern(idx['designs'],r['design'],designs)
                if r['title'].startswith(r['design']+' '):row[2]=intern(idx['productTypes'],r['title'][len(r['design'])+1:],types)
            kept.append(row)
        idx['rows']=kept;write_text(ip,compact(idx)+'\n')
        meta_path=Path('catalog/meta.json')
        if meta_path.is_file():
            meta=json.loads(meta_path.read_text());meta['count']=len(kept)
            meta['typeCounts']={key:sum(bool(r[7]) if key=='kids' else r[4]==key for r in kept) for key in meta.get('typeCounts',{})}
            meta['themeCounts']={key:sum(key in r[6] for r in kept) for key in meta.get('themeCounts',{})}
            write_text(meta_path,compact(meta)+'\n')
    for file in subprocess.check_output(['git','ls-files','-z','*.html']).decode().split('\0'):
        if not file:continue
        p=Path(file)
        if not p.is_file():continue
        s=p.read_text()
        if 'myspreadshop.com' in s or 'printify.me/product/' in s or '/products/' in s or 'www.zazzle.com/' in s or '/i/' in s:
            changed=cat.update_html(p,s)
            if changed!=s:write_text(p,changed)
    for p in Path('.').iterdir():
        if p.is_file() and any(k in p.name for k in ['merchant','catalog']) and any(k in p.name for k in ['.xml','.tsv','.csv']):cat.feed(p)
    print(f"{host}: {len(cat.by_id)} checked IDs; {len(cat.by_path)} mapped legacy routes; {len(cat.held)} withheld IDs in this release.")

if __name__=='__main__':main()
