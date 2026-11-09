"""Read public video publication dates and descriptions without playing or downloading videos."""
import argparse,concurrent.futures,collections,gzip,html,json,re,threading,time,urllib.request,urllib.error
from pathlib import Path
CHANNEL='UC5EY2rDVHdIOskfZcwR8t3Q'
gate=threading.Lock();next_request=0.;retry_until=0.
def check(v):
 global next_request,retry_until
 with gate:
  now=time.monotonic();scheduled=max(now,next_request,retry_until);next_request=scheduled+0.28
 time.sleep(max(0,scheduled-time.monotonic()))
 id=v['id']
 try:
  q=urllib.request.Request('https://www.youtube.com/watch?v='+id,headers={'User-Agent':'JasonColemanStorefront/1.0','Accept-Language':'en-US,en;q=0.9','Accept-Encoding':'gzip'})
  with urllib.request.urlopen(q,timeout=18) as r:
   raw=r.read();s=(gzip.decompress(raw) if r.getheader('Content-Encoding')=='gzip' else raw).decode('utf-8','replace')
  m=re.search(r'(?:var\s+)?ytInitialPlayerResponse\s*=\s*',s)
  if not m:return {'id':id,'status':'metadata absent'}
  data=json.JSONDecoder().raw_decode(s[m.end():])[0]
  a=data.get('videoDetails',{});b=data.get('microformat',{}).get('playerMicroformatRenderer',{})
  if a.get('videoId')!=id or a.get('channelId')!=CHANNEL:return {'id':id,'status':'identity unconfirmed'}
  txt=a.get('shortDescription','');lines=[]
  for line in txt.splitlines():
   line=html.unescape(line).strip()
   if not line or len(line)<26 or re.search(r'https?://|www\.|^(?:[0-9]+:|#|subscribe|follow |watch more|shop now|buy now)',line,re.I):continue
   if line.lower()==a.get('title','').lower():continue
   lines.append(line)
   if len(' '.join(lines))>340:break
  desc=' '.join(lines)
  if len(desc)>510:desc=desc[:507].rsplit(' ',1)[0]+'.'
  out={'id':id,'status':'verified','title':a.get('title',v['title']),'desc':desc,'date':b.get('uploadDate') or b.get('publishDate'),'seconds':int(a['lengthSeconds']) if str(a.get('lengthSeconds','')).isdigit() else None,'embeddable':data.get('playabilityStatus',{}).get('playableInEmbed') is not False}
  return out
 except urllib.error.HTTPError as e:
  if e.code==429:
   delay=e.headers.get('Retry-After','90')
   with gate:retry_until=max(retry_until,time.monotonic()+(int(delay) if delay.isdigit() else 90))
  return {'id':id,'status':'http_'+str(e.code)}
 except Exception as e:return {'id':id,'status':str(e)[:110]}
def run(src,checkpoint):
 videos=json.loads(gzip.decompress(src.read_bytes()));seen={}
 if checkpoint.exists():
  for l in checkpoint.read_text().splitlines():
   if l.strip():
    r=json.loads(l);seen[r['id']]=r
 todo=[v for v in videos if v['id'] not in seen or seen[v['id']]['status']!='verified']
 with checkpoint.open('a',encoding='utf-8',buffering=1) as out,concurrent.futures.ThreadPoolExecutor(9) as ex:
  its=iter(todo);tasks={ex.submit(check,x) for x in __import__('itertools').islice(its,12)};counter=collections.Counter()
  while tasks:
   done,tasks=concurrent.futures.wait(tasks,return_when=concurrent.futures.FIRST_COMPLETED)
   for f in done:
    r=f.result();seen[r['id']]=r;counter[r['status']]+=1;out.write(json.dumps(r,ensure_ascii=False)+'\n')
    if sum(counter.values())>=30 and sum(counter[k] for k in ['http_403','http_429','http_503'])>sum(counter.values())*.75:raise RuntimeError('Publisher blocked bulk metadata requests')
    item=next(its,None)
    if item is not None:tasks.add(ex.submit(check,item))
 print('Video metadata',dict(collections.Counter(x['status'] for x in seen.values())))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);p.add_argument('--checkpoint',type=Path,required=True);p.add_argument('--apply',action='store_true');a=p.parse_args();run(a.archive,a.checkpoint)
 if a.apply:
  videos=json.loads(gzip.decompress(a.archive.read_bytes()));results={}
  for line in a.checkpoint.read_text().splitlines():
   if line.strip():
    r=json.loads(line)
    if r['status']=='verified':results[r['id']]=r
  for v in videos:
   r=results.get(v['id'],{})
   for field in ['title','date','desc','seconds','embeddable']:
    if r.get(field) is not None:v[field]=r[field]
  tmp=a.archive.with_name(a.archive.name+'.next')
  tmp.write_bytes(gzip.compress(json.dumps(videos,ensure_ascii=False,separators=(',',':')).encode(),mtime=0));tmp.replace(a.archive)
