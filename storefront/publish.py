"""Build and check both sites from this source, then optionally commit and push both docs folders."""
import argparse,json,os,shutil,subprocess,sys,tempfile
from pathlib import Path
BASE=Path(__file__).resolve().parent
SITES={'urban':('urbanclothesmarket.com','aaahoneydo-arch/urban-clothes-market'),'jason':('jasontvmarketplace.com','aaahoneydo-arch/jason-coleman-media-network')}
p=argparse.ArgumentParser();p.add_argument('--urban',type=Path,required=True);p.add_argument('--jason',type=Path,required=True);p.add_argument('--push',action='store_true');a=p.parse_args()
def git(root,*args):return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
jobs=[]
with tempfile.TemporaryDirectory(prefix='verified-storefronts-') as td:
    for target,(host,remote) in SITES.items():
        root=getattr(a,target).resolve();url=git(root,'remote','get-url','origin').removesuffix('.git').lower()
        if url not in ['https://github.com/'+remote.lower(),'git@github.com:'+remote.lower()]:raise SystemExit('Unexpected origin: '+str(root))
        if (root/'CNAME').read_text().strip()!=host:raise SystemExit('Wrong domain in '+str(root))
        if git(root,'branch','--show-current')!='main':raise SystemExit('Select the production main branch in '+str(root))
        if git(root,'status','--porcelain','--','docs'):raise SystemExit('Save current docs changes in '+str(root)+' before replacing this build.')
        out=Path(td)/target;subprocess.run([sys.executable,str(BASE/'build.py'),'--target',target,'--out',str(out),'--legacy',str(root)],check=True)
        subprocess.run([sys.executable,str(BASE/'check.py'),'--source',str(BASE),'--out',str(out),'--domain',host],check=True);jobs.append((root,out))
    for root,out in jobs:
        destination=root/'docs'; staging=root/'.storefront-build-next';previous=root/'.storefront-build-previous'
        if staging.exists() or previous.exists():raise SystemExit('Inspect the previous build transaction in '+str(root))
        shutil.copytree(out,staging)
        if destination.exists():destination.rename(previous)
        try:staging.rename(destination)
        except OSError:
            if previous.exists():previous.rename(destination)
            raise
        if previous.exists():shutil.rmtree(previous)
    if a.push:
        for root,out in jobs:
            git(root,'add','-f','--','docs')
            if subprocess.run(['git','-C',str(root),'diff','--cached','--quiet','--','docs']).returncode:
                git(root,'commit','--only','-m','Publish checked bookstore, merchandise and video catalog','--','docs')
            git(root,'push','origin','main')
