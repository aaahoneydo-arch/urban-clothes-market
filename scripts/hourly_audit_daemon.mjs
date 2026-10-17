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
    if (latest && latest.complianceScore < 95) {
      console.warn(`[Self-Healing Triggered] Compliance score is ${latest.complianceScore}%. Running self-heal...`);
      const healOut = execSync('node scripts/heal-catalog-visuals-and-links.mjs', { cwd, encoding: 'utf8' });
      console.log(healOut);
    }
  }
} catch (err) {
  console.error('[Audit Daemon Error]:', err.message);
}

console.log(`[${new Date().toISOString()}] === HOURLY AUDIT CYCLE COMPLETED SUCCESSFULLY ===`);
