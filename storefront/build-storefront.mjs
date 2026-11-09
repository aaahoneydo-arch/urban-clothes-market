// The live GitHub Pages publication is main/docs. Run the verified shared builder.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = process.env.STOREFRONT_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
const prefix = python === 'py' ? ['-3'] : [];
const checkOnly = process.argv.includes('--check');
const commands = checkOnly
  ? [['check.py','--out',path.join(root,'docs'),'--domain','urbanclothesmarket.com']]
  : [['build_single.py','--target','urban','--root',root]];
for (const [script,...args] of commands) {
  const result=spawnSync(python,[...prefix,path.join(root,'storefront',script),...args],{cwd:root,stdio:'inherit'});
  if(result.error) throw result.error;
  if(result.status!==0) process.exit(result.status||1);
}
