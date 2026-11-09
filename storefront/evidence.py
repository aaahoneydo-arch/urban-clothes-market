"""Seal the approved catalog and reject accidental edits made outside the verified importer."""
import datetime,hashlib,json,gzip
from pathlib import Path
def seal(catalog,evidence):
    catalog=Path(catalog);rows=json.loads(gzip.decompress(catalog.read_bytes()));files=[]
    for path in evidence:
        p=Path(path);files.append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    info={'catalogSha256':hashlib.sha256(catalog.read_bytes()).hexdigest(),'designs':len(rows),'offers':sum(len(g['items']) for g in rows),'checkedOn':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'evidence':files}
    catalog.with_name('merch-verification.json').write_text(json.dumps(info,indent=2)+'\n')
def check(catalog):
    catalog=Path(catalog);info=json.loads(catalog.with_name('merch-verification.json').read_text())
    if hashlib.sha256(catalog.read_bytes()).hexdigest()!=info['catalogSha256']:
        raise ValueError('Merchandise changed outside the verified importer. Rebuild the catalog with refresh_merch.py and the seller receipts.')
    return info
