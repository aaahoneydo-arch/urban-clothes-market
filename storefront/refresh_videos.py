"""Import public Videos, Shorts and Live lists from Jason TV without downloading media."""
import argparse,datetime,gzip,json,re
from pathlib import Path
CHANNEL='UC5EY2rDVHdIOskfZcwR8t3Q'
p=argparse.ArgumentParser();p.add_argument('--dir',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
seen={}
for kind in ('videos','shorts','streams'):
    feed=json.loads((a.dir/('yt-'+kind+'.json')).read_text());assert feed.get('channel_id')==CHANNEL,kind
    for item in feed['entries']:
        id=item.get('id');name=item.get('title')
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}',id or '') or not name or name in ['[Private video]','[Deleted video]']:continue
        if id in seen:continue
        row={'id':id,'title':name,'kind':kind}
        if item.get('duration') is not None:row['seconds']=int(item['duration'])
        if item.get('description'):row['desc']=item['description'][:500]
        if item.get('upload_date') and re.fullmatch(r'\d{8}',item['upload_date']):row['date']=datetime.datetime.strptime(item['upload_date'],'%Y%m%d').date().isoformat()
        seen[id]=row
if not seen:raise SystemExit('Empty channel inventory')
a.out.write_bytes(gzip.compress(json.dumps(list(seen.values()),ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
from collections import Counter
print(len(seen),dict(Counter(x['kind'] for x in seen.values())))
