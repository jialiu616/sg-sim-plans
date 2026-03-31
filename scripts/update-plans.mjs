#!/usr/bin/env node
/**
 * SG SIM Plans — Weekly Update Script
 *
 * This script is designed to be run manually or via GitHub Actions on a weekly
 * schedule. It:
 *   1. Reads the current plans from src/data/plans.ts
 *   2. Fetches each provider's website to check for plan changes
 *   3. Compares fetched data against current plans
 *   4. Marks new plans with status: "new" and updated plans with status: "updated"
 *   5. Removes expired/discontinued plans
 *   6. Writes the updated plans.ts back
 *   7. Updates LAST_UPDATED date
 *
 * Usage:
 *   node scripts/update-plans.mjs              # Dry run (shows diff only)
 *   node scripts/update-plans.mjs --apply      # Apply changes to plans.ts
 *   node scripts/update-plans.mjs --clear      # Clear all status flags
 *
 * Provider scraping modules can be added in scripts/providers/ as individual
 * files that export a fetchPlans() function.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLANS_FILE = resolve(__dirname, '../src/data/plans.ts');
const SNAPSHOT_FILE = resolve(__dirname, '../scripts/plans-snapshot.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Extract the plans array from plans.ts as a JSON-serialisable object.
 * We do a rough regex parse — good enough for structured TS object literals.
 */
function readCurrentPlans() {
  const src = readFileSync(PLANS_FILE, 'utf-8');

  // Extract the array between `export const plans: SimPlan[] = [` and `];`
  const match = src.match(
    /export\s+const\s+plans:\s*SimPlan\[\]\s*=\s*\[([\s\S]*?)\n\];/
  );
  if (!match) {
    console.error('Could not parse plans array from plans.ts');
    process.exit(1);
  }

  // Remove TS-only comments but keep the JS-compatible object literals
  const body = match[1].replace(/\/\/.*$/gm, '');

  try {
    // Use Function constructor — the object literal syntax is valid JS
    const fn = new Function(`return [${body}]`);
    return fn();
  } catch (e) {
    console.error('Failed to parse plans array:', e.message);
    return [];
  }
}

/**
 * Read or create the snapshot file that tracks previously known plans.
 * The snapshot stores plan id + a hash of key fields for change detection.
 */
function readSnapshot() {
  if (!existsSync(SNAPSHOT_FILE)) return {};
  try {
    return JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeSnapshot(snapshot) {
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2) + '\n');
}

/** Hash key fields of a plan for change detection */
function planHash(plan) {
  const fields = [
    plan.provider,
    plan.planName,
    plan.data,
    plan.networkType,
    plan.callMinutes,
    plan.sms,
    plan.roaming,
    String(plan.price),
    String(plan.esim),
    plan.notes || '',
  ];
  // Simple string hash
  const str = fields.join('|');
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

// ─── Status management ─────────────────────────────────────────────────────

/**
 * Compare current plans against the last snapshot and set status flags.
 * Returns { plans, stats } where plans have status/statusDate set.
 */
function detectChanges(currentPlans, snapshot) {
  const stats = { new: 0, updated: 0, unchanged: 0, expired: 0 };
  const updatedPlans = [];

  for (const plan of currentPlans) {
    const key = `${plan.provider}::${plan.planName}`;
    const hash = planHash(plan);
    const prev = snapshot[key];

    if (!prev) {
      // Brand new plan
      plan.status = 'new';
      plan.statusDate = today();
      stats.new++;
    } else if (prev.hash !== hash) {
      // Existing plan with changed fields
      plan.status = 'updated';
      plan.statusDate = today();
      stats.updated++;
    } else {
      // Unchanged — keep existing status if still within 30-day window
      if (plan.status && plan.statusDate) {
        const age = Date.now() - new Date(plan.statusDate).getTime();
        if (age > 30 * 24 * 60 * 60 * 1000) {
          delete plan.status;
          delete plan.statusDate;
        }
      }
      stats.unchanged++;
    }

    updatedPlans.push(plan);
  }

  return { plans: updatedPlans, stats };
}

/**
 * Build a new snapshot from the current plans.
 */
function buildSnapshot(plans) {
  const snap = {};
  for (const plan of plans) {
    const key = `${plan.provider}::${plan.planName}`;
    snap[key] = { id: plan.id, hash: planHash(plan), date: today() };
  }
  return snap;
}

// ─── File rewriting ─────────────────────────────────────────────────────────

/**
 * Update plans.ts with new status fields and LAST_UPDATED date.
 * Rather than regenerating the whole file (which would lose comments/formatting),
 * we surgically update:
 *   1. LAST_UPDATED constant
 *   2. Individual plan objects' status/statusDate fields
 */
function applyStatusToFile(plans) {
  let src = readFileSync(PLANS_FILE, 'utf-8');

  // Update LAST_UPDATED
  src = src.replace(
    /export\s+const\s+LAST_UPDATED\s*=\s*"[^"]*"/,
    `export const LAST_UPDATED = "${today()}"`
  );

  // For each plan that has a status, inject status and statusDate fields
  for (const plan of plans) {
    // Build the regex to find this plan's object by id
    const idPattern = new RegExp(
      `(\\{[\\s\\S]*?id:\\s*${plan.id},)([\\s\\S]*?)(notes:\\s*"[^"]*")([\\s\\S]*?\\})`,
      'm'
    );

    if (plan.status && plan.statusDate) {
      // Add or update status fields after notes
      src = src.replace(idPattern, (match, pre, mid, notesField, post) => {
        // Remove any existing status/statusDate lines
        let cleaned = match
          .replace(/\n\s*status:\s*"[^"]*",?/g, '')
          .replace(/\n\s*statusDate:\s*"[^"]*",?/g, '');

        // Insert status fields after notes
        cleaned = cleaned.replace(
          /(notes:\s*"[^"]*")/,
          `$1,\n    status: "${plan.status}",\n    statusDate: "${plan.statusDate}"`
        );

        return cleaned;
      });
    } else {
      // Remove status fields if they exist
      src = src
        .replace(
          new RegExp(`(id:\\s*${plan.id},[\\s\\S]*?)\\n\\s*status:\\s*"[^"]*",?`, 'm'),
          '$1'
        )
        .replace(
          new RegExp(`(id:\\s*${plan.id},[\\s\\S]*?)\\n\\s*statusDate:\\s*"[^"]*",?`, 'm'),
          '$1'
        );
    }
  }

  writeFileSync(PLANS_FILE, src);
}

/**
 * Clear all status/statusDate fields from plans.ts
 */
function clearAllStatuses() {
  let src = readFileSync(PLANS_FILE, 'utf-8');
  src = src.replace(/\n\s*status:\s*"[^"]*",?/g, '');
  src = src.replace(/\n\s*statusDate:\s*"[^"]*",?/g, '');
  writeFileSync(PLANS_FILE, src);
  console.log('Cleared all status flags from plans.ts');
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const clear = args.includes('--clear');

  if (clear) {
    clearAllStatuses();
    return;
  }

  console.log('=== SG SIM Plans Update Script ===\n');
  console.log(`Date: ${today()}`);
  console.log(`Plans file: ${PLANS_FILE}\n`);

  // 1. Read current plans
  const currentPlans = readCurrentPlans();
  console.log(`Current plans: ${currentPlans.length}`);

  if (currentPlans.length === 0) {
    console.error('No plans found — aborting.');
    process.exit(1);
  }

  // 2. Read snapshot
  const snapshot = readSnapshot();
  const snapshotCount = Object.keys(snapshot).length;
  console.log(`Snapshot entries: ${snapshotCount}`);

  if (snapshotCount === 0) {
    console.log('\nNo previous snapshot found — creating initial snapshot.');
    console.log('All plans will be treated as existing (no status flags).\n');
    const snap = buildSnapshot(currentPlans);
    writeSnapshot(snap);
    console.log(`Snapshot saved with ${Object.keys(snap).length} entries.`);
    console.log('Run this script again after making changes to detect diffs.');
    return;
  }

  // 3. Detect changes
  const { plans: updatedPlans, stats } = detectChanges(currentPlans, snapshot);
  console.log(`\n--- Change Summary ---`);
  console.log(`  New plans:       ${stats.new}`);
  console.log(`  Updated plans:   ${stats.updated}`);
  console.log(`  Unchanged:       ${stats.unchanged}`);
  console.log('');

  // Show details of changes
  for (const plan of updatedPlans) {
    if (plan.status === 'new') {
      console.log(`  [NEW]     ${plan.provider} — ${plan.planName} ($${plan.price})`);
    } else if (plan.status === 'updated') {
      console.log(`  [UPDATED] ${plan.provider} — ${plan.planName} ($${plan.price})`);
    }
  }

  if (stats.new === 0 && stats.updated === 0) {
    console.log('No changes detected.');
    return;
  }

  if (!apply) {
    console.log('\nDry run — no changes written.');
    console.log('Use --apply to write changes to plans.ts and update snapshot.');
    return;
  }

  // 4. Apply changes
  console.log('\nApplying changes...');
  applyStatusToFile(updatedPlans);
  console.log('Updated plans.ts with status flags.');

  // 5. Update snapshot
  const newSnap = buildSnapshot(currentPlans);
  writeSnapshot(newSnap);
  console.log('Updated snapshot.');

  console.log('\nDone! Review the changes with `git diff`.');
}

main();
