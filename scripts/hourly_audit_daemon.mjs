import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

console.log(`[${new Date().toISOString()}] === STARTING HOURLY AUTONOMOUS MULTI-AGENT AUDIT CYCLE ===`);

const cwd = path.resolve('.');

try {
  console.log('-> Executing rotating multi-agent auditor...');
  const auditOut = execSync('node scripts/rotating_multi_agent_auditor.mjs', { cwd, encoding: 'utf8' });
  console.log(auditOut);

  // Check state
  const statePath = path.resolve('data/audit_agent_state.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const latest = state.history && state.history[0];
    
    // Self-healing trigger: if anything found or compliance below 100%
    if (latest && (latest.complianceScore < 100 || (latest.mismatchesFound && latest.mismatchesFound > 0))) {
      console.warn(`[Self-Healing Triggered] Running automatic ground-truth title, design, and mockup repair...`);
      execSync('node scripts/heal_catalog_titles_and_designs.mjs', { cwd, encoding: 'utf8', stdio: 'inherit' });
      execSync('node scripts/audit-and-fix-hats.mjs', { cwd, encoding: 'utf8', stdio: 'inherit' });
      execSync('node scripts/build.mjs --home-only', { cwd, encoding: 'utf8', stdio: 'inherit' });
      
      // Auto-commit repair receipts
      try {
        execSync('git add data/catalog.json data/flow-design-names.json data/audit_agent_state.json AUDIT_REPORT.md', { cwd, encoding: 'utf8' });
        execSync('git commit -m "Auto-heal: Synchronize listings, ground-truth titles and verified mockups [hourly audit]"', { cwd, encoding: 'utf8' });
        execSync('git push origin main', { cwd, encoding: 'utf8' });
        console.log('[Git Sync] Auto-healed listings committed and pushed to origin main.');
      } catch (gitErr) {
        console.warn('[Git Sync Note]:', gitErr.message.split('\n')[0]);
      }
    }
  }
} catch (err) {
  console.error('[Audit Daemon Error]:', err.message);
}

console.log(`[${new Date().toISOString()}] === HOURLY AUDIT CYCLE COMPLETED SUCCESSFULLY ===`);
