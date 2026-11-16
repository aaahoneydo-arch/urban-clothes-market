"""Build and check both sites from this source, then optionally commit and push both docs folders."""
import argparse,os,shutil,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
SITES={'urban':('urbanclothesmarket.com','aaahoneydo-arch/urban-clothes-market'),'jason':('jasontvmarketplace.com','aaahoneydo-arch/jason-coleman-media-network')}
p=argparse.ArgumentParser();p.add_argument('--urban',type=Path,required=True);p.add_argument('--jason',type=Path,required=True);p.add_argument('--push',action='store_true');a=p.parse_args()
def git(root,*args):return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
def rmtree_fast(path):
 if not path.exists():return
 if os.name=='nt':subprocess.run(['cmd','/c','rd','/s','/q',str(path)],check=False)
 if path.exists():shutil.rmtree(path)
jobs=[]
try:
 for target,(host,remote) in SITES.items():
  root=getattr(a,target).resolve();url=git(root,'remote','get-url','origin').removesuffix('.git').lower()
  if url not in ['https://github.com/'+remote.lower(),'git@github.com:'+remote.lower()]:raise SystemExit('Unexpected origin: '+str(root))
  if (root/'CNAME').read_text().strip()!=host:raise SystemExit('Wrong domain in '+str(root))
  if git(root,'branch','--show-current')!='main':raise SystemExit('Select the production main branch in '+str(root))
  if git(root,'status','--porcelain','--','docs'):raise SystemExit('Save current docs changes in '+str(root)+' before replacing this build.')
  if (root/'.storefront-build-previous').exists():raise SystemExit('Inspect the previous build transaction in '+str(root))
  staging=root/'.storefront-build-next'
  if staging.exists():rmtree_fast(staging)
  subprocess.run([sys.executable,str(BASE/'build.py'),'--target',target,'--out',str(staging),'--legacy',str(root)],check=True)
  subprocess.run([sys.executable,str(BASE/'check.py'),'--source',str(BASE),'--out',str(staging),'--domain',host],check=True)
  jobs.append((root,staging))
 for root,staging in jobs:
  destination=root/'docs';previous=root/'.storefront-build-previous'
  if destination.exists():destination.rename(previous)
  try:staging.rename(destination)
  except OSError:
   if previous.exists():previous.rename(destination)
   raise
  rmtree_fast(previous)
 if a.push:
  for root,_ in jobs:
   paths=['docs']
   if root==a.urban.resolve():
    source_files=[
     'storefront/build.py','storefront/publish.py','storefront/check.py','storefront/legacy.py','storefront/ad_aliases.py',
     'storefront/site.js','storefront/site.css','storefront/merch.json.gz','storefront/merch-verification.json',
     'storefront/books.json','storefront/videos.json','storefront/archive.json.gz','checkout/storefront-import-history.ndjson.gz',
    ]
    paths.extend(f for f in source_files if (root/f).exists())
   git(root,'add','-f','--',*paths)
   if subprocess.run(['git','-C',str(root),'diff','--cached','--quiet','--',*paths]).returncode:
    git(root,'commit','--only','-m','Publish checked bookstore, merchandise and video catalog','--',*paths)
   git(root,'push','origin','main')
except Exception:
 for _,staging in jobs:rmtree_fast(staging)
 raise
