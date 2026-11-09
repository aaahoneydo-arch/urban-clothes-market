"""Check generated links, publisher separation and catalog coverage before deployment."""
import argparse,collections,gzip,json,posixpath,re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin,urlsplit,unquote
class Links(HTMLParser):
 def __init__(self):super().__init__();self.anchors=[];self.base='';self.title=False;self.h1=0
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='base':self.base=a.get('href','')
  if t=='title':self.title=True
  if t=='h1':self.h1+=1
  if t=='a' and a.get('href'):self.anchors.append(a['href'])
def run(folder,src,domain):
 root=Path(folder);src=Path(src);products={v['url'] for g in json.loads(gzip.decompress((src/'merch.json.gz').read_bytes())) for v in g['items']}
 books={'https://www.amazon.com/dp/'+f['asin'] for b in json.loads((src/'books.json').read_text()) for f in b['formats']};archive=json.loads(gzip.decompress((src/'archive.json.gz').read_bytes()))
 seen=set();issues=[];localcache={};market=set();n=0
 for f in root.rglob('*.html'):
  page=f.relative_to(root).as_posix();n+=1
  if re.fullmatch(r'google[a-z0-9]+\.html',page,re.I):continue
  p=Links();p.feed(f.read_text());base=urljoin('https://'+domain+'/'+page,p.base)
  if not p.title:issues.append((page,'missing title'))
  for a in p.anchors:
   url=urljoin(base,a);u=urlsplit(url)
   if u.netloc==domain:
    dest=unquote(u.path).lstrip('/');dest+= 'index.html' if not dest or dest.endswith('/') else ''
    if dest not in localcache:localcache[dest]=(root/dest).is_file()
    if not localcache[dest]:issues.append((page,'missing local '+dest))
   elif u.netloc=='www.amazon.com' and u.path.startswith('/dp/'):
    if url not in books:issues.append((page,'unknown book '+url))
    seen.add(url)
   elif u.netloc=='www.spreadshirt.com':
    if url not in products:issues.append((page,'unknown seller offer '+url))
    market.add(url)
   elif u.netloc in ['www.youtube.com','youtube.com','www.amazon.com','service.spreadshirt.com','urbanclothesmarket.com','jasontvmarketplace.com']:pass
   else:issues.append((page,'unexpected destination '+url))
 if market!=products:issues.append(('catalog',f'{len(products-market)} merchandise offers absent from HTML'))
 if seen!=books:issues.append(('catalog',f'{len(books-seen)} Amazon editions absent from HTML'))
 for v in archive:
  if not (root/'watch'/v['id']/'index.html').is_file():issues.append(('archive','missing '+v['id']))
 print('HTML pages',n,'checked internal destinations',len(localcache),'seller offers',len(market),'Amazon editions',len(seen),'YouTube uploads',len(archive),'errors',len(issues))
 if issues:print(issues[:15]);raise SystemExit(1)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--source',default=str(Path(__file__).resolve().parent));p.add_argument('--domain',required=True);a=p.parse_args();run(a.out,a.source,a.domain)
