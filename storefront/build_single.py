"""Build in isolation and replace docs only after validating all outbound and local links."""
import argparse,os,shutil,subprocess,sys,tempfile
from pathlib import Path
SRC=Path(__file__).resolve().parent
def build(root,target):
    root=root.resolve();host={'urban':'urbanclothesmarket.com','jason':'jasontvmarketplace.com'}[target]
    if (root/'CNAME').read_text().strip()!=host:raise ValueError('Incorrect storefront root')
    destination=root/'docs';previous=root/'.previous-validated-docs'
    if previous.exists():raise SystemExit('A previous local publication still needs recovery: '+str(previous))
    with tempfile.TemporaryDirectory(dir=root,prefix='.prepare-storefront-') as temp:
        out=Path(temp)/'output'
        subprocess.run([sys.executable,str(SRC/'build.py'),'--target',target,'--out',str(out),'--legacy',str(root)],check=True)
        subprocess.run([sys.executable,str(SRC/'check.py'),'--source',str(SRC),'--out',str(out),'--domain',host],check=True)
        if destination.exists():destination.rename(previous)
        try:out.rename(destination)
        except OSError:
            if previous.exists():previous.rename(destination)
            raise
        if previous.exists():shutil.rmtree(previous)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--target',choices=['urban','jason'],required=True);a=p.parse_args();build(a.root,a.target)
