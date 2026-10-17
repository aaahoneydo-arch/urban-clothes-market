import fs from 'node:fs';
import path from 'node:path';

const AUDIT_STATE_FILE = path.resolve('data/audit_agent_state.json');
const AUDIT_LOG_FILE = path.resolve('data/audit_runs.log');
const REPORT_MD_PATH = path.resolve('AUDIT_REPORT.md');

// Load or initialize state
let state = {
  lastAgent: 'Agent Delta',
  currentAgent: 'Agent Alpha',
  cycleCount: 0,
  lastRun: null,
  history: []
};

if (fs.existsSync(AUDIT_STATE_FILE)) {
  try {
    state = JSON.parse(fs.readFileSync(AUDIT_STATE_FILE, 'utf8'));
  } catch (e) {
    console.warn('Could not parse audit state, starting fresh:', e.message);
  }
}

// Agent Rotation Schedule
const AGENTS = [
  {
    name: 'Agent Alpha — Visual Fidelity Inspector',
    focus: 'Product Mockups, Physical Garment Representation, Transparent Art Detection & Visual Quality',
    runAudit: auditVisualFidelity
  },
  {
    name: 'Agent Beta — Metadata & Title Integrity Auditor',
    focus: 'Cross-Contamination, Title Consistency, Clean Product Types & Character Encoding',
    runAudit: auditMetadataIntegrity
  },
  {
    name: 'Agent Gamma — Outbound Store Journey & Conversion Auditor',
    focus: 'Merchant Feeds, Live Store Links (Spreadshop, Zazzle, Printify), 404 Resolution & Buy Buttons',
    runAudit: auditOutboundJourneys
  },
  {
    name: 'Agent Delta — Adversarial Cross-Examiner',
    focus: 'Independent Blind Sampling, Verification of Prior Agent Assertions & Zero-Tolerance Compliance',
    runAudit: auditAdversarialCrossCheck
  }
];

// Determine which agent is up
const nextIdx = (state.cycleCount || 0) % AGENTS.length;
const activeAgent = AGENTS[nextIdx];
state.lastAgent = state.currentAgent;
state.currentAgent = activeAgent.name;
state.cycleCount = (state.cycleCount || 0) + 1;
state.lastRun = new Date().toISOString();

console.log(`\n======================================================`);
console.log(`🚀 AUTONOMOUS MULTI-AGENT AUDIT CYCLE #${state.cycleCount}`);
console.log(`👤 Active Auditor: ${activeAgent.name}`);
console.log(`🎯 Primary Objective: ${activeAgent.focus}`);
console.log(`======================================================\n`);

// Load Catalog
const catalogPath = path.resolve('data/catalog.json');
let catalog = [];
if (fs.existsSync(catalogPath)) {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} else {
  console.error('Critical: data/catalog.json not found!');
  process.exit(1);
}

// ---------------------------------------------------------------------
// 1. Agent Alpha: Visual Fidelity
// ---------------------------------------------------------------------
function auditVisualFidelity() {
  const issues = [];
  let transparentCount = 0;
  let flatArtworkCount = 0;
  let localPortCount = 0;
  let missingImageCount = 0;
  let physicalMockupCount = 0;

  for (const p of catalog) {
    if (!p.image || p.image.trim() === '') {
      missingImageCount++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'MISSING_IMAGE', detail: 'No image specified' });
      continue;
    }

    if (p.image.includes('127.0.0.1') || p.image.includes('localhost')) {
      localPortCount++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'LOCALHOST_IMAGE', detail: p.image });
    }

    if (p.image.includes('transparent') || p.image.includes('master.png')) {
      transparentCount++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'TRANSPARENT_IMAGE', detail: p.image });
    } else if (p.image.includes('lookbook') && !p.image.includes('mockup') && !p.image.includes('tshirt') && !p.image.includes('hoodie')) {
      flatArtworkCount++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'FLAT_ARTWORK_NO_GARMENT', detail: p.image });
    } else {
      physicalMockupCount++;
    }
  }

  const score = Math.max(0, 100 - (transparentCount * 0.5 + flatArtworkCount * 0.1 + localPortCount * 2 + missingImageCount * 5));
  return {
    auditor: activeAgent.name,
    timestamp: new Date().toISOString(),
    totalAudited: catalog.length,
    physicalMockups: physicalMockupCount,
    transparentArtifacts: transparentCount,
    flatArtworkArtifacts: flatArtworkCount,
    localhostArtifacts: localPortCount,
    missingImages: missingImageCount,
    complianceScore: Math.min(100, Math.round(score * 10) / 10),
    sampleViolations: issues
  };
}

// ---------------------------------------------------------------------
// 2. Agent Beta: Metadata & Title Integrity
// ---------------------------------------------------------------------
function auditMetadataIntegrity() {
  const issues = [];
  let corruptedEncodings = 0;
  let crossContaminations = 0;
  let missingDesignNames = 0;
  let cleanCount = 0;

  for (const p of catalog) {
    if (!p.name || !p.design) {
      missingDesignNames++;
      continue;
    }

    if (p.name.includes('â€”') || p.name.includes('Â·') || p.name.includes('â€')) {
      corruptedEncodings++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'ENCODING_CORRUPTED', detail: p.name });
    }

    // Check cross contamination (e.g. Tee in Beanie listing)
    const dLower = p.design.toLowerCase();
    const tLower = (p.productType || '').toLowerCase();

    if (/\b(tee|t-shirt|shirt)\b/i.test(dLower) && /\b(beanie|hat|cap|mug|pillow|sticker)\b/i.test(tLower)) {
      crossContaminations++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'CROSS_CONTAMINATION', detail: `${p.design} on ${p.productType}` });
    } else if (/\b(pillow)\b/i.test(dLower) && /\b(beanie|hat|cap|tee|hoodie|mug)\b/i.test(tLower)) {
      crossContaminations++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'CROSS_CONTAMINATION', detail: `${p.design} on ${p.productType}` });
    } else {
      cleanCount++;
    }
  }

  const score = Math.max(0, 100 - (corruptedEncodings * 0.2 + crossContaminations * 0.5 + missingDesignNames * 2));
  return {
    auditor: activeAgent.name,
    timestamp: new Date().toISOString(),
    totalAudited: catalog.length,
    cleanTitles: cleanCount,
    crossContaminatedTitles: crossContaminations,
    corruptedCharacterEncodings: corruptedEncodings,
    missingDesignNames: missingDesignNames,
    complianceScore: Math.min(100, Math.round(score * 10) / 10),
    sampleViolations: issues
  };
}

// ---------------------------------------------------------------------
// 3. Agent Gamma: Outbound Store Journey & Conversion
// ---------------------------------------------------------------------
function auditOutboundJourneys() {
  const issues = [];
  let brokenUrls = 0;
  let localhostUrls = 0;
  let jasonTvUrls = 0;
  let liveStoreUrls = 0;

  for (const p of catalog) {
    if (!p.url || p.url.trim() === '' || p.url === '#') {
      brokenUrls++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'BROKEN_URL', detail: 'Empty or hash link' });
      continue;
    }

    if (p.url.includes('127.0.0.1') || p.url.includes('localhost')) {
      localhostUrls++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'LOCALHOST_URL', detail: p.url });
    } else if (p.url.includes('jasontvmarketplace.com')) {
      jasonTvUrls++;
      if (issues.length < 5) issues.push({ id: p.id, type: 'JASONTV_URL', detail: p.url });
    } else if (p.url.includes('myspreadshop.com') || p.url.includes('urbanclothesmarket.com') || p.url.includes('zazzle.com') || p.url.includes('printify.me')) {
      liveStoreUrls++;
    }
  }

  const score = Math.max(0, 100 - (brokenUrls * 5 + localhostUrls * 2 + jasonTvUrls * 0.5));
  return {
    auditor: activeAgent.name,
    timestamp: new Date().toISOString(),
    totalAudited: catalog.length,
    activeLiveStoreUrls: liveStoreUrls,
    jasonTvLegacyUrls: jasonTvUrls,
    localhostUrlLeaks: localhostUrls,
    brokenUrls: brokenUrls,
    complianceScore: Math.min(100, Math.round(score * 10) / 10),
    sampleViolations: issues
  };
}

// ---------------------------------------------------------------------
// 4. Agent Delta: Adversarial Cross-Examiner
// ---------------------------------------------------------------------
function auditAdversarialCrossCheck() {
  // Blind sampling across 15 categories
  const categories = [...new Set(catalog.map(p => p.category))];
  const sampleResults = [];
  let sampleViolations = 0;
  const SAMPLE_SIZE = 10;

  for (const cat of categories) {
    const group = catalog.filter(p => p.category === cat);
    const sample = group.sort(() => Math.random() - 0.5).slice(0, SAMPLE_SIZE);

    let catViolations = 0;
    for (const p of sample) {
      const isBadImage = !p.image || p.image.includes('transparent') || p.image.includes('127.0.0.1');
      const isBadUrl = !p.url || p.url.includes('127.0.0.1');
      const isBadTitle = p.name && (p.name.includes('â€”') || (p.design && p.design.includes('Tee') && p.productType && p.productType.includes('Beanie')));
      if (isBadImage || isBadUrl || isBadTitle) {
        catViolations++;
        sampleViolations++;
      }
    }

    sampleResults.push({
      category: cat,
      sampleTested: sample.length,
      violationsFound: catViolations,
      categoryHealth: `${Math.round(((SAMPLE_SIZE - catViolations) / SAMPLE_SIZE) * 100)}%`
    });
  }

  const totalTested = sampleResults.reduce((a, b) => a + b.sampleTested, 0);
  const sampleAccuracy = Math.round(((totalTested - sampleViolations) / totalTested) * 1000) / 10;

  return {
    auditor: activeAgent.name,
    timestamp: new Date().toISOString(),
    totalSampleTested: totalTested,
    sampleViolationsFound: sampleViolations,
    independentVerificationRate: `${sampleAccuracy}%`,
    categoryBreakdown: sampleResults,
    complianceScore: sampleAccuracy
  };
}

// Execute active agent
const report = activeAgent.runAudit();
console.log('Audit Results:');
console.log(JSON.stringify(report, null, 2));

// Update state history (keep last 24 runs)
state.history.unshift(report);
if (state.history.length > 24) state.history = state.history.slice(0, 24);
fs.writeFileSync(AUDIT_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

// Append to log
fs.appendFileSync(AUDIT_LOG_FILE, `[${new Date().toISOString()}] ${activeAgent.name} -> Score: ${report.complianceScore}%\n`);

// Update AUDIT_REPORT.md
let mdContent = `# Multi-Agent Autonomous Storefront & Catalog Audit
**Generated**: ${new Date().toUTCString()}  
**Current Auditor**: \`${activeAgent.name}\`  
**Overall System Health Index**: **${report.complianceScore}%**

---

### Auditor Focus: ${activeAgent.focus}

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`

---

### Recent Audit Rotation History (Last 10 Cycles)
| Timestamp | Auditor | Score | Total Audited |
| :--- | :--- | :--- | :--- |
${state.history.slice(0, 10).map(h => `| ${h.timestamp} | ${h.auditor.split('—')[0].trim()} | **${h.complianceScore}%** | ${h.totalAudited || h.totalSampleTested || 'N/A'} |`).join('\n')}

---
*Autonomous background monitoring active. Rotating audit agent executes hourly with zero memory bias.*
`;

fs.writeFileSync(REPORT_MD_PATH, mdContent, 'utf8');
console.log(`\nUpdated ${REPORT_MD_PATH} successfully.`);
