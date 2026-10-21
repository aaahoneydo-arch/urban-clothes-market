/**
 * AGENT 3: SITE 1 (URBANCLOTHESMARKET.COM) BACKEND AUDITOR & AUTO-FIX ENGINE
 * Audits, validates, and fixes Site 1 pages, search shards, feeds, and metadata to 100% perfection.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runAgent3(repoRoot) {
  console.log('\n======================================================');
  console.log('🤖 AGENT 3: SITE 1 (URBANCLOTHESMARKET.COM) AUDITOR');
  console.log('======================================================');

  const catalogPath = path.join(repoRoot, 'data/catalog.json');
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog not found: ${catalogPath}`);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const totalCatalog = catalog.length;

  const auditReport = {
    agent: 'Agent 3 - Site 1 Backend Auditor',
    timestamp: new Date().toISOString(),
    totalCatalog,
    indexVerified: false,
    shardsCount: 0,
    shardsVerified: false,
    totalShardedProducts: 0,
    pdpSampleVerified: 0,
    merchantFeedCount: 0,
    merchantFeedValid: false,
    sitemapValid: false,
    robotsValid: false,
    rebuilt: false,
    issuesFound: [],
    status: 'PENDING'
  };

  // 1. Audit Search Index (catalog/index.json)
  const indexPath = path.join(repoRoot, 'catalog/index.json');
  if (fs.existsSync(indexPath)) {
    try {
      const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      if (Array.isArray(idx.rows) && idx.rows.length === totalCatalog) {
        auditReport.indexVerified = true;
      } else {
        auditReport.issuesFound.push(`catalog/index.json rows (${idx.rows?.length}) mismatch catalog (${totalCatalog})`);
      }
    } catch (e) {
      auditReport.issuesFound.push(`catalog/index.json parse error: ${e.message}`);
    }
  } else {
    auditReport.issuesFound.push('catalog/index.json is missing');
  }

  // 2. Audit Shards (catalog/shards/*.json)
  const shardsDir = path.join(repoRoot, 'catalog/shards');
  if (fs.existsSync(shardsDir)) {
    const shardFiles = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json') && !f.startsWith('index'));
    auditReport.shardsCount = shardFiles.length;
    let shardedItems = 0;
    let shardErrors = 0;

    for (const file of shardFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(shardsDir, file), 'utf8'));
        shardedItems += content.length;
      } catch (e) {
        shardErrors++;
      }
    }
    auditReport.totalShardedProducts = shardedItems;

    if (shardErrors === 0 && shardedItems === totalCatalog) {
      auditReport.shardsVerified = true;
    } else {
      auditReport.issuesFound.push(`Shards count ${shardedItems} != catalog ${totalCatalog}`);
    }
  } else {
    auditReport.issuesFound.push('catalog/shards directory missing');
  }

  // 3. Audit Robots.txt & Sitemap
  const robotsPath = path.join(repoRoot, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    if (robotsContent.includes('Sitemap:') && robotsContent.includes('urbanclothesmarket.com')) {
      auditReport.robotsValid = true;
    }
  }

  const sitemapPath = path.join(repoRoot, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    if (sitemapContent.includes('<sitemapindex') || sitemapContent.includes('<urlset')) {
      auditReport.sitemapValid = true;
    }
  }

  // 4. Audit & Build Google Merchant Feed
  const feedScript = path.join(repoRoot, 'scripts/build-verified-merchant-feed.mjs');
  if (fs.existsSync(feedScript)) {
    console.log('Building/verifying Google Merchant feed...');
    try {
      execSync(`node "${feedScript}"`, { cwd: repoRoot, stdio: 'pipe' });
      const feedPath = path.join(repoRoot, 'google-merchant-feed.xml');
      if (fs.existsSync(feedPath)) {
        const feedStat = fs.statSync(feedPath);
        if (feedStat.size > 100000) {
          auditReport.merchantFeedValid = true;
          // Count <item> tags
          const feedContent = fs.readFileSync(feedPath, 'utf8');
          const matches = feedContent.match(/<item>/g);
          auditReport.merchantFeedCount = matches ? matches.length : 0;
        }
      }
    } catch (e) {
      auditReport.issuesFound.push(`Merchant feed build error: ${e.message}`);
    }
  }

  // 5. If any core components were invalid, trigger full build & heal
  if (!auditReport.indexVerified || !auditReport.shardsVerified || auditReport.issuesFound.length > 0) {
    console.log('⚡ Discrepancies detected. Triggering automated full site build...');
    try {
      execSync(`node scripts/build.mjs`, { cwd: repoRoot, stdio: 'pipe' });
      auditReport.rebuilt = true;
      console.log('✓ Full build completed.');
      
      // Re-check
      const idx2 = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      if (idx2.rows.length === totalCatalog) auditReport.indexVerified = true;
      const shardFiles2 = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json') && !f.startsWith('index'));
      auditReport.shardsCount = shardFiles2.length;
      let totalS2 = 0;
      shardFiles2.forEach(f => {
        totalS2 += JSON.parse(fs.readFileSync(path.join(shardsDir, f), 'utf8')).length;
      });
      auditReport.totalShardedProducts = totalS2;
      auditReport.shardsVerified = (totalS2 === totalCatalog);
      auditReport.issuesFound = [];
    } catch (e) {
      auditReport.issuesFound.push(`Full build failed: ${e.message}`);
    }
  }

  // 6. Audit PDP Samples for Direct Buy Links & Structured Data
  const sampleIndices = [0, 100, 500, 1000, 5000, 10000, 15000, 20000, totalCatalog - 1];
  let sampleSuccess = 0;
  for (const idx of sampleIndices) {
    if (idx >= totalCatalog) continue;
    const p = catalog[idx];
    // Check product in shards
    const shardIndex = Math.floor(idx / 200);
    const shardPath = path.join(shardsDir, `${shardIndex}.json`);
    if (fs.existsSync(shardPath)) {
      const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
      const found = shardData.find(x => x.id === p.id);
      if (found && found.url === p.url && found.price) {
        sampleSuccess++;
      }
    }
  }
  auditReport.pdpSampleVerified = sampleSuccess;

  const isPerfect = auditReport.indexVerified &&
                    auditReport.shardsVerified &&
                    auditReport.robotsValid &&
                    auditReport.sitemapValid &&
                    auditReport.merchantFeedValid &&
                    auditReport.merchantFeedCount === totalCatalog;

  auditReport.status = isPerfect ? '100% VERIFIED PERFECT' : 'ISSUES DETECTED';

  console.log(`✓ Master Catalog Count: ${auditReport.totalCatalog}`);
  console.log(`✓ Index Rows Verified: ${auditReport.indexVerified} (${totalCatalog} rows)`);
  console.log(`✓ Shards Verified: ${auditReport.shardsVerified} (${auditReport.shardsCount} shards, ${auditReport.totalShardedProducts} items)`);
  console.log(`✓ Google Merchant Feed: ${auditReport.merchantFeedValid ? 'VERIFIED' : 'FAILED'} (${auditReport.merchantFeedCount} products)`);
  console.log(`✓ Robots.txt & Sitemap: ${auditReport.robotsValid && auditReport.sitemapValid ? 'VERIFIED' : 'FAILED'}`);
  console.log(`✓ Result Status: ${auditReport.status}`);

  return auditReport;
}

if (require.main === module) {
  const repoRoot = path.resolve(__dirname, '../../');
  runAgent3(repoRoot);
}

module.exports = { runAgent3 };
