"""Publish only checked Spreadshirt items whose product artwork and appearance can be matched."""
import csv,gzip,html,io,json,re
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
from xml.sax.saxutils import escape
def write_feeds(store,old):
    raw={}
    if store.target=='urban':paths=['data/catalog.json','data/catalog-additions.json','data/gothic-launch-verified.json']
    else:paths=['real_products_catalog.json','catalog-additions.json','shop/products-catalog.json']
    for src in paths:
        p=Path(old)/src
        if p.is_file():
            for item in json.loads(p.read_text()):raw[item.get('id')]=item
    rows=[]
    for g in store.designs:
        reference=re.search(r'DPV\d+D(\d+)X',g.get('image',''))
        for o in g['items']:
            img=o.get('image') or (g.get('image','') if o['sku']==g['primary'] else '')
            if not img:
                p=raw.get(o['sku'],{});source=p.get('image') or p.get('img') or '';parts=urlsplit(source);offer=parse_qs(urlsplit(o['url']).query)
                m=re.search(r'/DPT(\d+)A(\d+)DPV\d+D(\d+)X',parts.path)
                if reference and parts.hostname=='image.spreadshirtmedia.com' and m and m[1]==o['sku'].split('-')[-1] and m[2]==offer['appearance'][0] and m[3]==reference[1]:img=source
            if not img:continue
            rows.append(dict(id=o['sku'],title=g['design']+' '+o['type'],description=g['description'] or (g['design']+' on '+o['type']),link=o['url'],image_link=img,price=o['price']+' USD',availability='in_stock',condition='new',brand='Urban Clothes Market'))
    fields=['id','title','description','link','image_link','price','availability','condition','brand']
    items=''.join('<item>'+''.join('<g:'+k+'>'+escape(str(r[k]))+'</g:'+k+'>' for k in fields)+'</item>' for r in rows)
    xml=('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Urban Clothes Market on Spreadshirt</title><link>https://urbanclothesmarket.com/</link><description>Verified merchandise with matching seller imagery.</description>'+items+'</channel></rss>').encode()
    buf=io.StringIO(newline='');w=csv.DictWriter(buf,fieldnames=fields,delimiter='\t',lineterminator='\n');w.writeheader();w.writerows(rows)
    for f in ['google-merchant-spreadshop-all-products.xml','google-merchant-spreadshop-all-products.xml.gz','google-merchant-feed.xml.gz']:
        if f.startswith('google-merchant-spreadshop') or (Path(old)/f).is_file():(store.out/f).write_bytes(gzip.compress(xml,mtime=0) if f.endswith('.gz') else xml)
    for f in ['bing-merchant-spreadshop-all-products.tsv','microsoft-merchant-feed.tsv','bing-merchant-ucm-master.tsv']:
        if f.startswith('bing-merchant-spreadshop') or (Path(old)/f).is_file():(store.out/f).write_text(buf.getvalue(),encoding='utf-8')
    print('Matching merchandise feed rows:',len(rows))
