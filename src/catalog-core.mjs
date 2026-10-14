import {TYPES as OLD_TYPES,THEMES as OLD_THEMES,slug} from './catalog-model.mjs';
export {slug};
export const TYPES=OLD_TYPES;
export const THEMES=OLD_THEMES.map(t=>t[0]==='cats'?[t[0],t[1],/\bcats?\b/i,t[3]]:t[0]==='cars'?[t[0],t[1],/\bcars?\b|garage|modification|backroad/i,t[3]]:t[0]==='gamers'?[t[0],t[1],/player|controller|robot|gamer|gaming|arcade|noob|pixel art|side quest|tabletop|d20/i,t[3]]:t[0]==='humor'?[t[0],t[1],/judgemental|angry|naughty|fault|cuss|problems|other man|other woman|war crime|small talk|social|thumbs/i,t[3]]:t);
export const SHOP_HOSTS={'urbanclothesmarket.myspreadshop.com':'Spreadshop','urbanclothesmarket.threadless.com':'Threadless','jasontv-marketplace-shop.fourthwall.com':'Fourthwall','urban-clothes-market.printify.me':'Printify','urban-clothes-market.printful.me':'Printful'};
export function normalize(raw){const seen=new Set();const priority=['hoodies','jackets','hats','mugs','bags','stickers','art','pets','accessories','home','bottoms','tees'];return raw.map(p=>{
 if(p.status==='quarantined'||p.issues?.length)throw Error('Unverified product cannot be published: '+p.id);
 const url=new URL(p.url);const store=SHOP_HOSTS[url.hostname];if(url.protocol!=='https:'||!store)throw Error('Unsupported purchase URL: '+p.url);
 const id=store==='Spreadshop'?url.searchParams.get('sellable'):p.id;
 if(!id||seen.has(id))throw Error('Missing or duplicate product identity: '+id);seen.add(id);
 if(store==='Threadless'&&!url.pathname.includes('/designs/'))throw Error('Threadless product link required');
 if(store==='Fourthwall'&&!url.pathname.startsWith('/products/'))throw Error('Fourthwall product link required');
 const parts=p.name.split(' - '),productType=p.productType||parts.pop(),design=p.design||parts.join(' - ');
 if(!design||!productType||!p.image)throw Error('Incomplete source product '+id);
 const kids=/kid|baby|babies|toddler|youth|infant/i.test(productType),category=priority.find(id=>TYPES.find(t=>t[0]===id)[2].test(productType))||'home';
 const themes=THEMES.filter(([id,,r])=>id==='kids'?kids:id==='urban'?!kids&&['tees','hoodies','hats','jackets','bottoms'].includes(category):r?.test(design)).map(x=>x[0]);
 let image=p.image;if(!image.startsWith('/')){const u=new URL(image);if(u.hostname==='image.spreadshirtmedia.com'){u.searchParams.set('width','600');u.searchParams.set('height','600');}image=u.href;}
 const price=Number(String(p.price??'').replace(/[^0-9.]/g,''))||null;
 const audience=kids?'Kids & Babies':/\bwomen(?:['’]s)?\b|\bwomens\b|\bladies\b/i.test(productType)?'Women':/\bmen(?:['’]s)?\b|\bmens\b/i.test(productType)?'Men':'Unisex & Everyone';
 const brand=[['Under Armour',/under armour/i],['Stanley/Stella',/stanley\/stella/i],['Bella + Canvas',/bella/i],['Champion',/champion/i],['Gildan',/gildan/i],['Adidas',/adidas/i],['Augusta Sportswear',/augusta/i],['Bayside',/bayside/i],['Flexfit',/flexfit/i]].find(([,re])=>re.test(productType))?.[0]||'Other brands';
 const canonical='/products/'+slug(design+' '+productType)+'-'+id+'/';
 const productPath=p.path&&/^\/products\/[a-z0-9-]+\/$/.test(p.path)?p.path:canonical;
 return {id,name:p.name,design,productType,url:url.href,image,price,store,sourceDate:p.sourceDate||'2026-10-10',sizes:p.sizes||[],colors:p.colors||[],category,themes,audience,kids,brand,path:productPath,legacyPath:canonical};
 }).map((p,i)=>({...p,shard:Math.floor(i/200)}));}
