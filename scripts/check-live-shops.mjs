import fs from 'node:fs';

async function checkShops() {
  try {
    const r = await fetch('https://urbanclothesmarket.myspreadshop.com/all?page=1');
    console.log('Spreadshop HTTP:', r.status);
    const html = await r.text();
    const countMatch = html.match(/class="[^"]*articleCount[^"]*"[^>]*>([^<]+)</i) || html.match(/(\d[\d,]+)\s*(items|results|products)/i);
    console.log('Spreadshop count:', countMatch ? countMatch[1] : 'not found');
  } catch (e) {
    console.error('Spreadshop error:', e.message);
  }

  try {
    const r2 = await fetch('https://urbanclothesmarket.threadless.com/');
    console.log('Threadless HTTP:', r2.status);
    const html2 = await r2.text();
    console.log('Threadless title:', html2.match(/<title>([^<]+)<\/title>/i)?.[1]);
  } catch (e) {
    console.error('Threadless error:', e.message);
  }
}

checkShops();
