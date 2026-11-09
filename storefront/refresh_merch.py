"""Generate the shared sellable catalog from public seller evidence and actual seller media."""
import argparse,collections,concurrent.futures,gzip,html,json,re,urllib.request
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
def slug(s):return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')[:90]
def fetch_image(group):
    candidates=sorted(group['items'],key=lambda v:({'20':0,'210':1,'31':2}.get(v['sku'].split('-')[-1],4),v['sku']))
    for record in candidates[:3]:
        try:
            req=urllib.request.Request(record['url'],headers={'User-Agent':'UrbanClothesMarket-CatalogAudit/1.0 (+https://urbanclothesmarket.com/)','Accept':'*/*','Accept-Encoding':'gzip'})
            with urllib.request.urlopen(req,timeout=18) as response:
                raw=response.read();s=(gzip.decompress(raw) if response.getheader('Content-Encoding')=='gzip' else raw).decode('utf8','replace')
            schema=json.loads(re.search(r'<script\b[^>]*id="seo-json-ld"[^>]*>(.*?)</script>',s,re.S)[1])
            a=json.loads(re.search(r'window\.analytics\.product\s*=\s*(\{[^\n]+?\});',s)[1])
            query=parse_qs(urlsplit(record['url']).query)
            if a['designerName']!='Urban Clothes Market' or a['articleId']!=group['id'] or a['sellableId']!=query['sellable'][0] or str(a['appearanceId'])!=query['appearance'][0]:continue
            images=schema['image'];im=images[0] if isinstance(images,list) else images
            if urlsplit(im).hostname!='image.spreadshirtmedia.com':continue
            return record['sku'],im,html.unescape(schema.get('description',''))
        except (OSError,KeyError,IndexError,ValueError,TypeError):continue
    return candidates[0]['sku'],'',''
def refresh(evidence,existing,out):
    rows={}
    for filename in evidence:
        p=Path(filename);raw=gzip.decompress(p.read_bytes()).decode() if p.suffix=='.gz' else p.read_text()
        for ln in raw.splitlines():
            if not ln.strip():continue
            r=json.loads(ln)
            if r['shop']=='spreadshop':rows[r['id']]=r
    old={g['id']:g for g in json.loads(gzip.decompress(Path(existing).read_bytes()))} if existing and Path(existing).exists() else {}
    groups={}
    for sku,r in rows.items():
        if r.get('status')!='verified':continue
        original=urlsplit(r['original']);u=urlsplit(r['url']);q=parse_qs(u.query);oq=parse_qs(original.query);d=re.search(r'-[AD]([a-z0-9]+)$',original.path)
        if not d or u.scheme!='https' or u.hostname!='www.spreadshirt.com' or not u.path.endswith('-D'+d[1]) or q.get('sellable')!=[sku.removeprefix('spreadshop-')] or (q.get('appearance')!=oq.get('appearance') and oq.get('appearance')!=[r.get('previousAppearance')]) or not q.get('appearance') or r.get('currency')!='USD':raise ValueError('Conflicting seller evidence for '+sku)
        name=r['design'];type_=r['title'].removeprefix(name).strip();identifier=d[1]
        group=groups.setdefault(identifier,{'id':identifier,'slug':old.get(identifier,{}).get('slug') or slug(name)+'-'+identifier[-6:],'design':name,'items':[]})
        offer={'sku':sku,'type':type_,'price':f"{float(r['price']):.2f}",'url':r['url']}
        if urlsplit(r.get('image','')).hostname=='image.spreadshirtmedia.com':offer['image']=r['image']
        group['items'].append(offer)
    needs=[]
    for key,g in groups.items():
        prev=old.get(key,{})
        original=next((o for o in prev.get('items',[]) if o['sku']==prev.get('primary')),None)
        if prev.get('image') and original and any(it['sku']==original['sku'] and it['url']==original['url'] for it in g['items']):
            g.update({k:prev[k] for k in ['primary','image','description']})
        else:
            supplied=next((it for it in sorted(g['items'],key=lambda o:(o['sku'].split('-')[-1]!='20',o['sku'])) if urlsplit(rows[it['sku']].get('image','')).hostname=='image.spreadshirtmedia.com'),None)
            if supplied:
                r=rows[supplied['sku']];g.update(primary=supplied['sku'],image=r['image'],description=html.unescape(r.get('description','')))
            else:needs.append(g)
    with concurrent.futures.ThreadPoolExecutor(4) as ex:
        for g,(sku,img,desc) in zip(needs,ex.map(fetch_image,needs)):
            g.update(primary=sku,image=img,description=desc)
    for g in groups.values():g['items'].sort(key=lambda o:(o['sku']!=g['primary'],o['type'].lower(),o['sku']))
    data=json.dumps(list(groups.values()),ensure_ascii=False,separators=(',',':')).encode()
    Path(out).write_bytes(gzip.compress(data,mtime=0))
    from evidence import seal
    seal(out,evidence)
    print('Checked',len(rows),'variant IDs;',len(groups),'published designs;',sum(len(g['items']) for g in groups.values()),'exact offers.')
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--evidence',action='append',required=True);a.add_argument('--existing');a.add_argument('--out',required=True);o=a.parse_args();refresh(o.evidence,o.existing,o.out)
