import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {normalize} from '../src/catalog-model.mjs';
const p=normalize(JSON.parse(fs.readFileSync('data/catalog.json'))),idx=JSON.parse(fs.readFileSync('dist/catalog/index.json'));
const raw=JSON.parse(fs.readFileSync('data/catalog.json')),sync=JSON.parse(fs.readFileSync('data/catalog-sync.json'));assert.equal(p.length,raw.length);assert.equal(p.length,sync.totalProducts||sync.listings);assert.equal(idx.rows.length,p.length);assert.equal(new Set(p.map(x=>x.id)).size,p.length);assert(p.every(x=>fs.existsSync('dist'+x.path+'index.html')));assert(p.every(x=>!x.name.includes('\uFFFD')));
assert(p.filter(x=>/sweatshirt/i.test(x.productType)).every(x=>x.category==='hoodies'));assert(p.filter(x=>/tumbler/i.test(x.productType)).every(x=>x.category==='mugs'));assert(p.filter(x=>/jacket/i.test(x.productType)&&!/hoodie|sweatshirt/i.test(x.productType)).every(x=>x.category==='jackets'));
idx.rows.forEach(r=>r.push((idx.designs[r[1]]+' '+idx.productTypes[r[2]]+' '+r[6].join(' ')+' '+r[5]+' '+r[9]).toLowerCase()));
let code=fs.readFileSync('src/search-worker.js','utf8');code=code.slice(code.indexOf('const hash=')).replace('export function search','function search');code=code.slice(0,code.indexOf('self.onmessage'));const ctx={};vm.createContext(ctx);vm.runInContext(code,ctx);
const cats=ctx.search(idx,{theme:'cats',type:'hoodies',sort:'shuffle',seed:'test',size:24});assert(cats.total>0);assert(cats.rows.every(r=>p.find(x=>x.id===r.id).themes.includes('cats')&&p.find(x=>x.id===r.id).category==='hoodies'));
const newGaming=(sync.addedDesigns||[]).filter(x=>/gamer|arcade|noob/i.test(x.name));for(const design of newGaming){const result=ctx.search(idx,{q:design.name,theme:'gamers'});assert.equal(result.total,design.listings);}assert(p.filter(x=>/ornament/i.test(x.productType)).every(x=>x.audience==='Unisex & Everyone'));const all=ctx.search(idx,{sort:'shuffle',seed:'one',size:24}),second=ctx.search(idx,{sort:'shuffle',seed:'one',size:24,page:2}),changed=ctx.search(idx,{sort:'shuffle',seed:'two',size:24});assert(!all.rows.some(x=>second.rows.some(y=>y.id===x.id)));assert.notDeepEqual(all.rows.map(x=>x.id),changed.rows.map(x=>x.id));
const fav=ctx.search(idx,{savedOnly:true,favorites:[p[0].id]});assert.equal(fav.total,1);assert.equal(fav.rows[0].id,p[0].id);
const testBrand=p[0].brand||'Spreadshop';const champion=ctx.search(idx,{brand:testBrand});assert(champion.total>0);assert(champion.rows.every(r=>p.find(x=>x.id===r.id).brand===testBrand));
assert.equal(ctx.search(idx,{q:'no-matching-design-xyz'}).total,0);
const large={...idx,rows:Array.from({length:100000},(_,i)=>{let row=[...idx.rows[i%idx.rows.length]];row[0]='large-'+i;return row;})};let t=performance.now();const stress=ctx.search(large,{sort:'shuffle',seed:'scale',size:24,page:3000});assert.equal(stress.total,100000);assert.equal(stress.rows.length,24);const elapsed=Math.round(performance.now()-t);
const map=fs.readFileSync('dist/sitemap.xml','utf8');assert(map.includes('<sitemapindex'));const allSitemaps=[1,2,3,4].filter(n=>fs.existsSync('dist/sitemap-'+n+'.xml')).map(n=>fs.readFileSync('dist/sitemap-'+n+'.xml','utf8')).join('');assert(allSitemaps.includes(p.at(-1).path));
const booksData=JSON.parse(fs.readFileSync('data/books.json','utf8'));
assert.equal(booksData.books.length,18);
const homeHtml=fs.readFileSync('index.html','utf8');
assert(homeHtml.includes('Official Published Books on Amazon (18 Live Titles • 2 New Books Added Weekly)'));
assert(homeHtml.includes('B0HPJRHBB7')&&homeHtml.includes('B0HPJRC7LG'));
assert(fs.existsSync('books/index.html')&&fs.existsSync('dist/books/index.html'));
assert(fs.existsSync('guides/index.html')&&fs.existsSync('dist/guides/index.html'));
for(const b of booksData.books){
  assert(fs.existsSync(`books/${b.slug}/index.html`)&&fs.existsSync(`dist/books/${b.slug}/index.html`));
  const bh=fs.readFileSync(`books/${b.slug}/index.html`,'utf8');
  assert(bh.includes(`https://www.amazon.com/dp/${b.primaryAsin}`));
  assert(allSitemaps.includes(`/books/${b.slug}/`));
}
const guideDirs=fs.readdirSync('guides',{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
assert.equal(guideDirs.length,15);
for(const g of guideDirs){
  assert(fs.existsSync(`guides/${g}/index.html`)&&fs.existsSync(`dist/guides/${g}/index.html`));
  assert(allSitemaps.includes(`/guides/${g}/`));
}
const samplePdp=fs.readFileSync(p[0].path.slice(1)+'index.html','utf8');
assert(samplePdp.includes('Pair It With the Matching Book on Amazon'));
const bingRows=fs.readFileSync('bing-merchant-spreadshop-all-products.tsv','utf8').trim().split('\n').length-1;
const fbRows=fs.readFileSync('facebook-catalog-feed.csv','utf8').trim().split('\n').length-1;
const pinRows=fs.readFileSync('pinterest-catalog-feed.csv','utf8').trim().split('\n').length-1;
assert.equal(bingRows,p.length);
assert.equal(fbRows,p.length);
assert.equal(pinRows,p.length);
console.log(JSON.stringify({passed:true,realProducts:p.length,liveBooks:booksData.books.length,nicheGuides:guideDirs.length,feedRows:bingRows,themeTypeFilter:cats.total,brandFilter:champion.total,syntheticSearchItems:100000,syntheticSearchMs:elapsed,visibleCards:24}));
