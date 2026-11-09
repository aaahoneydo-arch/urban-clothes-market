"""Check a seller export, merge its receipts, and update the canonical catalog."""
import argparse,datetime,gzip,json,os,subprocess,sys,tempfile
from pathlib import Path
from import_batch import import_batch
from refresh_merch import refresh
BASE=Path(__file__).resolve().parent
def main():
    p=argparse.ArgumentParser();p.add_argument('export',type=Path);p.add_argument('--root',type=Path,default=BASE.parent);p.add_argument('--jason',type=Path);p.add_argument('--push',action='store_true');a=p.parse_args()
    root=a.root.resolve();check=root/'checkout'
    if (root/'CNAME').read_text().strip()!='urbanclothesmarket.com':raise SystemExit('Expected the Urban Clothes Market source checkout.')
    names=['spreadshirt-checkout-evidence.ndjson.gz','public-seller-evidence.ndjson.gz']
    evidence=[check/n for n in names]+[BASE/'initial-supplement.ndjson.gz']
    if not all(p.is_file() for p in evidence):raise SystemExit('Pull the complete canonical checkout before importing.')
    inputs,missing=import_batch(a.export);rolling=check/'storefront-import-history.ndjson.gz'
    with tempfile.TemporaryDirectory(prefix='seller-import-') as temp:
        temp=Path(temp);candidates=temp/'candidates.json';results=temp/'results.ndjson';candidates.write_text(json.dumps(inputs))
        subprocess.run([sys.executable,str(BASE/'verify_purchases.py'),'--source',str(candidates),'--output',str(results)],check=True)
        receipts=[json.loads(l) for l in results.read_text().splitlines() if l.strip()]
        if len(receipts)!=len(inputs):raise RuntimeError('Incomplete seller check. Previous catalog retained.')
        stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        (check/('batch-review-'+stamp+'.json')).write_text(json.dumps({'incompleteInputs':missing,'results':receipts},indent=2))
        if not any(r['status']=='verified' for r in receipts):raise SystemExit('No orderable seller offers verified. See batch review.')
        records={};previous=gzip.decompress(rolling.read_bytes()).decode() if rolling.is_file() else ''
        for line in previous.splitlines():
            if line.strip():r=json.loads(line);records[r['id']]=r
        for r in receipts:
            if r['status']=='verified' or r['status'] in ['http_404','http_410'] or r.get('detail') in ['Seller, design or variant mismatch','Requested appearance or sizes unavailable']:
                records[r['id']]=r
        out=temp/'storefront-import-history.ndjson.gz'
        out.write_bytes(gzip.compress(('\n'.join(json.dumps(r,ensure_ascii=False,separators=(',',':')) for r in records.values())+'\n').encode(),mtime=0))
        refresh([*evidence,out],BASE/'merch.json.gz',temp/'merch.json.gz')
        for src,dest in [(out,rolling),(temp/'merch.json.gz',BASE/'merch.json.gz'),(temp/'merch-verification.json',BASE/'merch-verification.json')]:
            dest.with_suffix(dest.suffix+'.next').write_bytes(src.read_bytes());os.replace(dest.with_suffix(dest.suffix+'.next'),dest)
    if a.jason:
        subprocess.run([sys.executable,str(BASE/'publish.py'),'--urban',str(root),'--jason',str(a.jason),*(['--push'] if a.push else [])],check=True)
    elif a.push:raise SystemExit('Pass the Jason TV checkout path to publish both sites.')
    print('Canonical seller catalog refreshed.')
if __name__=='__main__':main()
