#!/usr/bin/env node
/**
 * SG SIM Plans — Provider Change Monitor ("Sentinel")
 *
 * Fetches each provider's plan page, computes content fingerprints,
 * and compares against stored hashes to detect changes.
 *
 * Zero external dependencies — uses Node 20 built-in fetch + crypto.
 *
 * Usage:
 *   node scripts/check-providers.mjs          # Check all providers
 *
 * Exit codes:
 *   0 = changes detected (or first run / baseline created)
 *   1 = no changes detected
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = resolve(__dirname, 'provider-config.json');
const HASHES_FILE = resolve(__dirname, 'provider-hashes.json');

const FETCH_TIMEOUT = 15_000; // 15 seconds
const DELAY_BETWEEN = 2_000; // 2 seconds between requests
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sha256(content) {
  return createHash('sha256').update(content, 'utf-8').digest('hex').slice(0, 16);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Fetch a URL with a timeout. Returns the response body as a string,
 * or throws an error with a descriptive message.
 */
async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Timeout after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Strip volatile elements from HTML to reduce false positive change detection.
 * Removes CSRF tokens, nonces, session IDs, analytics snippets, timestamps, etc.
 */
function sanitizeHtml(html) {
  return html
    // Remove inline <script> blocks (analytics, tracking, session data)
    .replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '')
    // Remove <meta> tags with csrf, nonce, or token content
    .replace(/<meta[^>]*(?:csrf|nonce|token|gtm|analytics)[^>]*>/gi, '')
    // Remove data- attributes with dynamic values
    .replace(/\s+data-(?:csrf|nonce|token|session|gtm|track|analytics)[^=]*="[^"]*"/gi, '')
    // Remove common timestamp patterns (ISO dates, unix timestamps)
    .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^"'\s]*/g, '')
    .replace(/\b1[6-9]\d{8,11}\b/g, '') // unix timestamps 2020-2033
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract <script src="..."> and <link href="..."> URLs from HTML.
 * SPA build tools include content hashes in filenames — when the app
 * deploys new code, these URLs change.
 */
function extractBundleUrls(html) {
  const urls = [];

  // <script src="...">
  const scriptRe = /<script[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = scriptRe.exec(html)) !== null) {
    urls.push(m[1]);
  }

  // <link href="..."> (stylesheets, preloads)
  const linkRe = /<link[^>]+href=["']([^"']+)["']/gi;
  while ((m = linkRe.exec(html)) !== null) {
    urls.push(m[1]);
  }

  // Sort for deterministic hashing
  return urls.sort().join('\n');
}

// ─── Provider checking ──────────────────────────────────────────────────────

/**
 * Check a single provider. Returns a result object.
 */
async function checkProvider(config, prevData) {
  const result = {
    provider: config.provider,
    url: config.url,
    status: 'unchanged',
    changedSignals: [],
    error: null,
    signals: {},
    fingerprint: null,
  };

  let html;
  try {
    html = await fetchWithTimeout(config.url);
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
    return result;
  }

  // Compute each configured signal
  for (const signal of config.signals) {
    if (signal === 'html') {
      result.signals.html = sha256(sanitizeHtml(html));
    } else if (signal === 'bundle') {
      const bundleStr = extractBundleUrls(html);
      result.signals.bundle = bundleStr ? sha256(bundleStr) : null;
    }
  }

  // Composite fingerprint = hash of all signal hashes
  const sigValues = Object.values(result.signals).filter(Boolean).join('|');
  result.fingerprint = sha256(sigValues);

  // Compare with previous
  if (!prevData || !prevData.fingerprint) {
    result.status = 'new_baseline';
  } else if (result.fingerprint !== prevData.fingerprint) {
    result.status = 'changed';
    // Determine which signals changed
    for (const [key, val] of Object.entries(result.signals)) {
      if (val && prevData.signals && prevData.signals[key] !== val) {
        result.changedSignals.push(key);
      }
    }
  }

  return result;
}

// ─── Report generation ──────────────────────────────────────────────────────

function generateReport(results, hasBaseline) {
  const date = today();
  const changed = results.filter(r => r.status === 'changed');
  const errors = results.filter(r => r.status === 'error');
  const unchanged = results.filter(r => r.status === 'unchanged');
  const newBaseline = results.filter(r => r.status === 'new_baseline');

  const lines = [];
  lines.push(`## Provider Changes Detected — ${date}\n`);

  if (!hasBaseline) {
    lines.push('> **First run** — baseline fingerprints established for all providers.\n');
  }

  if (changed.length > 0) {
    lines.push(`### Changed (${changed.length})`);
    lines.push('| Provider | Signal | Link |');
    lines.push('|---|---|---|');
    for (const r of changed) {
      const sig = r.changedSignals.length > 0
        ? r.changedSignals.map(s => `${s} changed`).join(', ')
        : 'fingerprint changed';
      lines.push(`| ${r.provider} | ${sig} | [View plans](${r.url}) |`);
    }
    lines.push('');
  }

  if (errors.length > 0) {
    lines.push(`### Errors (${errors.length})`);
    lines.push('| Provider | Error | Consecutive |');
    lines.push('|---|---|---|');
    for (const r of errors) {
      lines.push(`| ${r.provider} | ${r.error} | ${r._consecutiveErrors || 1} |`);
    }
    lines.push('');
  }

  if (newBaseline.length > 0 && hasBaseline) {
    lines.push(`### New Baseline (${newBaseline.length})`);
    lines.push(newBaseline.map(r => r.provider).join(', '));
    lines.push('');
  }

  if (unchanged.length > 0) {
    lines.push(`### Unchanged (${unchanged.length})`);
    lines.push('<details><summary>Expand</summary>\n');
    lines.push(unchanged.map(r => r.provider).join(', '));
    lines.push('\n</details>\n');
  }

  lines.push('---');
  lines.push('To update: edit `src/data/plans.ts`, run `npm run update-plans -- --apply`, commit and push.');

  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.error('=== SG SIM Plans — Provider Change Monitor ===\n');
  console.error(`Date: ${today()}\n`);

  // Load config
  const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  console.error(`Providers: ${config.length}\n`);

  // Load previous hashes
  let hashes = {};
  const hasBaseline = existsSync(HASHES_FILE);
  if (hasBaseline) {
    try {
      hashes = JSON.parse(readFileSync(HASHES_FILE, 'utf-8'));
    } catch {
      hashes = {};
    }
  }

  // Check each provider sequentially
  const results = [];
  for (let i = 0; i < config.length; i++) {
    const prov = config[i];
    console.error(`  [${i + 1}/${config.length}] ${prov.provider}...`);

    const prev = hashes[prov.provider] || null;
    const result = await checkProvider(prov, prev);

    // Track consecutive errors
    if (result.status === 'error') {
      const prevErrors = prev?.consecutiveErrors || 0;
      result._consecutiveErrors = prevErrors + 1;
    }

    const icon = result.status === 'changed' ? '!!'
      : result.status === 'error' ? 'ERR'
      : result.status === 'new_baseline' ? 'NEW'
      : 'OK';
    console.error(`         [${icon}] ${result.status}${result.error ? ` (${result.error})` : ''}`);

    results.push(result);

    // Polite delay between requests
    if (i < config.length - 1) {
      await sleep(DELAY_BETWEEN);
    }
  }

  // Update hashes file
  const newHashes = {};
  for (const result of results) {
    const prev = hashes[result.provider] || {};

    if (result.status === 'error') {
      // Keep previous fingerprint on error, just update check date and error count
      newHashes[result.provider] = {
        ...prev,
        lastChecked: today(),
        consecutiveErrors: result._consecutiveErrors || 1,
        status: 'error',
        lastError: result.error,
      };
    } else {
      newHashes[result.provider] = {
        fingerprint: result.fingerprint,
        signals: result.signals,
        lastChecked: today(),
        lastChanged: result.status === 'changed' ? today() : (prev.lastChanged || null),
        consecutiveErrors: 0,
        status: result.status === 'new_baseline' ? 'baseline' : result.status,
      };
    }
  }

  writeFileSync(HASHES_FILE, JSON.stringify(newHashes, null, 2) + '\n');
  console.error(`\nFingerprints saved to ${HASHES_FILE}`);

  // Summary
  const changed = results.filter(r => r.status === 'changed');
  const errors = results.filter(r => r.status === 'error');
  const unchanged = results.filter(r => r.status === 'unchanged');
  const newBaselines = results.filter(r => r.status === 'new_baseline');

  console.error(`\n--- Summary ---`);
  console.error(`  Changed:      ${changed.length}`);
  console.error(`  Errors:       ${errors.length}`);
  console.error(`  Unchanged:    ${unchanged.length}`);
  console.error(`  New baseline: ${newBaselines.length}`);

  const hasChanges = changed.length > 0 || errors.length > 0 || !hasBaseline;

  if (hasChanges) {
    // Output Markdown report to stdout (captured by workflow)
    const report = generateReport(results, hasBaseline);
    console.log(report);
    console.error('\nChanges detected — report written to stdout.');
    process.exit(0);
  } else {
    console.error('\nNo changes detected.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
