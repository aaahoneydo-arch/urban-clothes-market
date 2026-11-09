"""Normalize an official composition/sellable export to inputs for verify_purchases.py."""
import argparse,json,re
from pathlib import Path
from urllib.parse import urlencode
def import_batch(source):
    blob=json.loads(Path(source).read_text(encoding='utf-8-sig'))
    if isinstance(blob,dict):
        blob=next((blob[k] for k in ['products','compositions','items','results'] if isinstance(blob.get(k),list)),None)
    if not isinstance(blob,list):raise ValueError('Expected a public product list or an official composition export.')
    result={};held=[]
    for row in blob:
        if row.get('url') and row.get('id') and row.get('store','spreadshop').lower() in ['spreadshop','spreadshirt']:
            out={k:row.get(k) for k in ['id','design','productType','name','url']};out['store']='spreadshop';result[out['id']]=out;continue
        design_id=str(row.get('id',''));name=row.get('title') or row.get('name')
        if not isinstance(name,str) or not re.fullmatch(r'[a-z0-9]+',design_id,re.I):held.append({'id':design_id,'reason':'missing design identifier or title'});continue
        for v in row.get('sellables',[]):
            sku=v.get('sellableId');kind=str(v.get('productTypeId',''));app=v.get('defaultAppearanceId') or next(iter(v.get('appearanceIds') or v.get('allowedAppearances') or []),None)
            if not sku or not re.fullmatch(r'[a-z0-9]+-\d+',sku,re.I) or not sku.endswith('-'+kind) or app is None:
                held.append({'id':design_id,'reason':'missing actual seller SKU or appearance'});continue
            key='spreadshop-'+sku;word=re.sub('[^a-z0-9]+','+',name.lower()).strip('+')
            q=urlencode({'sellable':sku,'appearance':app})
            result[key]={'id':key,'store':'spreadshop','design':name,'productType':v.get('productTypeName',''),'url':'https://www.spreadshirt.com/shop/design/'+word+'-D'+design_id+'?'+q}
    if not result:raise ValueError('No actual sellables in this export.')
    return list(result.values()),held
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('--out',required=True);a=p.parse_args();rows,held=import_batch(a.source)
    Path(a.out).write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')));Path(a.out+'.review.json').write_text(json.dumps(held,indent=2));print(len(rows),'candidates;',len(held),'incomplete rows retained for review.')
