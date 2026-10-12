import fs from 'node:fs';

const convIds = [
  'fb786c56-d5b3-4e08-ae25-b0fc3985046d',
  '69dc5877-c202-4b1d-bc0a-87f4241f4fed'
];

const results = {
  domains: new Set(),
  stores: new Set(),
  merchants: new Set(),
  bing: new Set(),
  snippets: []
};

for (const id of convIds) {
  const file = `C:/Users/aaaho/.gemini/antigravity-ide/brain/${id}/.system_generated/logs/transcript.jsonl`;
  if (!fs.existsSync(file)) continue;

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (const line of lines) {
    if (line.includes('bing') || line.includes('merchants.google.com') || line.includes('jasontvmarketplace') || line.includes('fourthwall') || line.includes('printify')) {
      const urls = line.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
      for (const u of urls) {
        if (u.includes('bing.com')) results.bing.add(u);
        else if (u.includes('merchants.google.com')) results.merchants.add(u);
        else if (u.includes('jasontvmarketplace') || u.includes('urbanclothesmarket')) results.domains.add(u);
        else if (u.includes('myspreadshop') || u.includes('threadless') || u.includes('printify') || u.includes('fourthwall') || u.includes('teepublic') || u.includes('redbubble')) results.stores.add(u);
      }
      if (line.includes('Bing') || line.includes('5872535700') || line.includes('jasontvmarketplace')) {
        results.snippets.push(line.slice(0, 300));
      }
    }
  }
}

console.log('=== DOMAINS ===');
for (const d of results.domains) console.log(d);

console.log('\n=== STORES ===');
for (const s of results.stores) console.log(s);

console.log('\n=== MERCHANTS ===');
for (const m of results.merchants) console.log(m);

console.log('\n=== BING ===');
for (const b of results.bing) console.log(b);

console.log('\n=== KEY SNIPPETS ===');
for (const sn of results.snippets.slice(0, 15)) console.log('-', sn);
