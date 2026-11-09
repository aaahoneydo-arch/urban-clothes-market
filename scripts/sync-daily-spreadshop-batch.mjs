// Compatible entry for the original daily export script in either production repository.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=fs.existsSync(path.join(dir,'CNAME')) ? dir : path.dirname(dir);
const ownDomain=fs.readFileSync(path.join(root,'CNAME'),'utf8').trim();
const candidates=ownDomain==='urbanclothesmarket.com' ? [root] : [
  process.env.URBAN_STORE_REPOSITORY,path.resolve(root,'../urban-clothes-market')
].filter(Boolean);
const canonical=candidates.find(r=>fs.existsSync(path.join(r,'storefront','sync_batch.py')));
if(!canonical) throw new Error('Set URBAN_STORE_REPOSITORY to the current aaahoneydo-arch/urban-clothes-market checkout.');
const args=process.argv.slice(2);
if(!args.length) throw new Error('Pass the new seller export JSON path. The current catalog is preserved.');
const python=process.env.STOREFRONT_PYTHON || (process.platform==='win32'?'py':'python3');
const targetArgs=[...(python==='py'?['-3']:[]),path.join(canonical,'storefront','sync_batch.py'),...args,'--root',canonical];
if(ownDomain==='jasontvmarketplace.com'&&!args.includes('--jason'))targetArgs.push('--jason',root);
const r=spawnSync(python,targetArgs,{stdio:'inherit'});if(r.error)throw r.error;process.exit(r.status??1);
