"""Read public merchandise links from the seller's own category and pagination pages."""
import collections,concurrent.futures,gzip,html,json,re,time,urllib.request,urllib.error
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,urljoin,parse_qs,urlencode
ROOT='https://www.spreadshirt.com/shop/user/urban+clothes+market'
HEAD={'User-Agent':'UrbanClothesMarket-CatalogAudit/1.0 (+https://urbanclothesmarket.com/)','Accept':'*/*','Accept-Encoding':'gzip'}
class Links(HTMLParser):
 def __init__(self): super().__init__();self.links=[]
 def handle_starttag(self,tag,pairs):
  if tag=='a':
   v=dict(pairs).get('href','')
   if v:self.links.append(v)
def read(url):
 req=urllib.request.Request(url,headers=HEAD)
 with urllib.request.urlopen(req,timeout=22) as r:
  b=r.read();return (gzip.decompress(b) if r.getheader('Content-Encoding')=='gzip' else b).decode('utf-8','replace')
def fetch(url,folder):
 file=folder/( __import__('hashlib').sha256(url.encode()).hexdigest()+'.json')
 if file.exists():return json.loads(file.read_text())
 if url==ROOT and Path('market-author.page').is_file():s=Path('market-author.page').read_text()
 else:s=read(url)
 parser=Links();parser.feed(s);linked=set();product_links={}
 for link in parser.links:
  full=urljoin(url,link);u=urlsplit(full)
  if u.hostname!='www.spreadshirt.com':continue
  if u.path.startswith('/shop/design/'):
   d=re.search(r'-D([a-z0-9]+)$',u.path);sku=parse_qs(u.query).get('sellable',[''])[0]
   if d and re.fullmatch('[a-z0-9]+-\d+',sku):product_links[sku]=(d[1],full)
  elif (u.path==urlsplit(ROOT).path or u.path.startswith(urlsplit(ROOT).path+'/')) and (not u.query or re.fullmatch('page=\d+',u.query)):
   linked.add(full.split('#')[0])
 blob=s.replace(chr(92)+'"','"');rows={}
 for m in re.finditer(r'"favorite":(\{[^{}]+\})',blob):
  try:v=json.loads(m[1])
  except ValueError:continue
  sku=v.get('sellableId');entry=product_links.get(sku)
  if not entry or v.get('compositionId')!=entry[0] or not v.get('appearanceId'):continue
  u=urlsplit(entry[1]);q={'sellable':sku,'appearance':str(v['appearanceId'])};target=u._replace(query=urlencode(q),fragment='').geturl()
  rows[sku]={'id':'spreadshop-'+sku,'store':'spreadshop','design':v['label'],'productType':'','url':target}
 result={'links':sorted(linked),'rows':list(rows.values())};file.write_text(json.dumps(result,ensure_ascii=False));return result
def run(out,folder,max_pages=1400):
 folder.mkdir(parents=True,exist_ok=True);seen=set();todo=collections.deque([ROOT]);rows={};errors={}
 with concurrent.futures.ThreadPoolExecutor(3) as pool:
  while todo and len(seen)<max_pages:
   batch=[]
   while todo and len(batch)<3:
    url=todo.popleft()
    if url not in seen:seen.add(url);batch.append(url)
   futures={u:pool.submit(fetch,u,folder) for u in batch}
   for u,f in futures.items():
    try:d=f.result()
    except urllib.error.HTTPError as e:
     errors[u]=str(e.code)
     if e.code in (403,429):raise RuntimeError('Seller requested a pause at '+u)
     continue
    except Exception as e:errors[u]=str(e);continue
    for r in d['rows']:rows.setdefault(r['id'],r)
    todo.extend(x for x in d['links'] if x not in seen)
   out.write_text(json.dumps(list(rows.values()),ensure_ascii=False,separators=(',',':')))
 if todo and len(seen)>=max_pages:raise RuntimeError('Seller discovery still has additional pages')
 print('Seller pages',len(seen),'listed SKUs',len(rows),'designs',len({urlsplit(r['url']).path.rsplit('-D',1)[-1] for r in rows.values()}),'inaccessible pages',len(errors));(folder/'errors.json').write_text(json.dumps(errors))
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);a=p.parse_args();run(a.out,a.cache)
