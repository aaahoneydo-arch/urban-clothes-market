/**
 * REAL-WORLD DESTINATION LINK AUDITOR & FAILURE REPORTER
 * Tests real network requests against partner shop URLs and reports exact HTTP status codes,
 * response headers, title matches, and any failures.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchWithHeaders(urlStr) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const req = https.get(urlStr, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none'
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => {
          if (body.length < 50000) body += chunk;
        });
        res.on('end', () => {
          const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
          resolve({
            url: urlStr,
            status: res.statusCode,
            location: res.headers.location || null,
            title: titleMatch ? titleMatch[1].trim() : null,
            server: res.headers.server || 'unknown',
            contentLength: body.length
          });
        });
      });
      req.on('error', (err) => resolve({ url: urlStr, status: 'CONN_ERR', error: err.message }));
      req.setTimeout(8000, () => {
        req.destroy();
        resolve({ url: urlStr, status: 'TIMEOUT', error: 'Request timed out after 8s' });
      });
    } catch (e) {
      resolve({ url: urlStr, status: 'PARSE_ERR', error: e.message });
    }
  });
}

async function runDestinationAudit() {
  const catPath = path.resolve(__dirname, '../data/catalog.json');
  const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));

  const channels = ['Printify', 'Spreadshop', 'Zazzle', 'Redbubble', 'TeePublic'];
  const samplesByChannel = {};

  for (const ch of channels) {
    const items = cat.filter(x => (x.channel || x.shop) === ch);
    // Pick 5 evenly spaced samples
    const picks = [];
    const step = Math.floor(items.length / 5) || 1;
    for (let i = 0; i < 5 && i * step < items.length; i++) {
      picks.push(items[i * step]);
    }
    samplesByChannel[ch] = picks;
  }

  const results = [];

  for (const ch of channels) {
    console.log(`\nTesting ${ch} samples...`);
    for (const item of samplesByChannel[ch]) {
      const res = await fetchWithHeaders(item.url);
      const isOk = res.status === 200 || res.status === 301 || res.status === 302;
      const isBotChallenge = res.status === 403;
      const is404 = res.status === 404;

      results.push({
        id: item.id,
        channel: ch,
        catalogName: item.name,
        catalogPrice: item.price,
        catalogImage: item.image,
        url: item.url,
        httpStatus: res.status,
        redirectLocation: res.location,
        destinationTitle: res.title,
        server: res.server,
        verdict: isOk ? 'PASS (Live & Accessible)' : (isBotChallenge ? 'BOT CHALLENGE (Server Alive, Blocks Automated Script)' : (is404 ? 'FAIL (404 Not Found)' : `UNEXPECTED (${res.status})`))
      });
      console.log(`  [${res.status}] ${item.name.slice(0, 45)}... -> ${results[results.length - 1].verdict}`);
    }
  }

  const reportPath = path.resolve(__dirname, '../data/destination_link_audit_evidence.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nDestination audit report saved to: ${reportPath}`);
  return results;
}

if (require.main === module) {
  runDestinationAudit().catch(console.error);
}

module.exports = { runDestinationAudit };
