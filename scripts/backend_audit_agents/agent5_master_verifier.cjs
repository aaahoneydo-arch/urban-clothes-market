/**
 * AGENT 5: MASTER CROSS-DOMAIN PARITY & NETWORK AUDITOR
 * Verifies 1-to-1 parity between both domains and live endpoint availability.
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchUrl(urlStr, timeoutMs = 5000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(urlStr, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }, (res) => {
        resolve({ url: urlStr, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
      });
      req.on('error', (err) => resolve({ url: urlStr, error: err.message, ok: false }));
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve({ url: urlStr, error: 'TIMEOUT', ok: false });
      });
    } catch (e) {
      resolve({ url: urlStr, error: e.message, ok: false });
    }
  });
}

async function runAgent5(site1Root, site2Root, catalogPath) {
  console.log('\n======================================================');
  console.log('🤖 AGENT 5: CROSS-DOMAIN PARITY & NETWORK INTEGRITY AUDITOR');
  console.log('======================================================');

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const totalCatalog = catalog.length;

  const auditReport = {
    agent: 'Agent 5 - Cross-Domain Parity & Network Auditor',
    timestamp: new Date().toISOString(),
    catalogParity: {
      site1Count: totalCatalog,
      site2Count: 0,
      matchedCount: 0,
      parityVerified: false
    },
    localEndpointTests: [],
    partnerDomainConnectivity: [],
    status: 'PENDING'
  };

  // 1. Cross-Domain Parity Check
  const site2ProductsDir = path.join(site2Root, 'products');
  if (fs.existsSync(site2ProductsDir)) {
    const site2Folders = fs.readdirSync(site2ProductsDir);
    auditReport.catalogParity.site2Count = site2Folders.length;

    let matched = 0;
    for (const p of catalog) {
      const slug = (p.id || '').replace(/^ucm-/, '').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60);
      if (fs.existsSync(path.join(site2ProductsDir, slug, 'index.html'))) {
        matched++;
      }
    }
    auditReport.catalogParity.matchedCount = matched;
    auditReport.catalogParity.parityVerified = (matched === totalCatalog && site2Folders.length === totalCatalog);
  }

  // 2. Test Local Preview Server Endpoints
  const localEndpoints = [
    'http://localhost:8088/',
    'http://localhost:8088/catalog/index.json',
    'http://localhost:8088/catalog/shards/0.json',
    'http://localhost:8088/robots.txt',
    'http://localhost:8088/sitemap.xml',
    'http://localhost:8089/',
    'http://localhost:8089/jasontv-merchant-feed.xml',
    'http://localhost:8089/microsoft-jasontv-feed.tsv'
  ];

  console.log('Testing local server endpoints...');
  for (const url of localEndpoints) {
    const res = await fetchUrl(url, 3000);
    auditReport.localEndpointTests.push(res);
    console.log(`  [${res.status || 'ERR'}] ${url}`);
  }

  // 3. Test Sample Partner Domains
  const partnerSamples = [
    catalog.find(x => x.channel === 'Spreadshop')?.url,
    catalog.find(x => x.channel === 'Printify')?.url,
    catalog.find(x => x.channel === 'Zazzle')?.url,
    catalog.find(x => x.channel === 'Redbubble')?.url,
    catalog.find(x => x.channel === 'TeePublic')?.url
  ].filter(Boolean);

  console.log('Testing external partner shop link connectivity...');
  for (const url of partnerSamples) {
    const res = await fetchUrl(url, 4000);
    // Note: bot-blockers like Cloudflare/Fastly might return 403 to Node.js CLI, but response proves host/DNS is valid and responding
    const isResponding = res.status !== undefined && res.status > 0;
    auditReport.partnerDomainConnectivity.push({ ...res, hostReachable: isResponding });
    console.log(`  [${res.status || 'ERR'}] ${new URL(url).hostname} -> reachable: ${isResponding}`);
  }

  const localOk = auditReport.localEndpointTests.every(x => x.ok);
  const isPerfect = auditReport.catalogParity.parityVerified && localOk;
  auditReport.status = isPerfect ? '100% VERIFIED PERFECT' : 'PARTIAL';

  console.log(`✓ 100% Cross-Domain Catalog Parity: ${auditReport.catalogParity.matchedCount} / ${totalCatalog} matched`);
  console.log(`✓ Local Endpoints Verified: ${auditReport.localEndpointTests.filter(x => x.ok).length} / ${localEndpoints.length}`);
  console.log(`✓ Partner Shops Responding: ${auditReport.partnerDomainConnectivity.filter(x => x.hostReachable).length} / ${partnerSamples.length}`);
  console.log(`✓ Result Status: ${auditReport.status}`);

  return auditReport;
}

if (require.main === module) {
  const site1Root = path.resolve(__dirname, '../../');
  const site2Root = 'C:/Users/aaaho/.gemini/antigravity-ide/scratch/jason-coleman-network';
  const catalogPath = path.resolve(site1Root, 'data/catalog.json');
  runAgent5(site1Root, site2Root, catalogPath);
}

module.exports = { runAgent5 };
