#!/usr/bin/env node
// Generates a PDF summary of Playwright test results.
// Reads test-results/results.json (produced by the JSON reporter)
// and renders a PDF via Playwright's bundled Chromium.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = path.join(__dirname, 'test-results', 'results.json');
const outputPath = path.join(__dirname, 'test-results', 'test-report.pdf');

if (!fs.existsSync(resultsPath)) {
  console.error(`❌ No results file found at ${resultsPath}`);
  console.error('   Run "npm run test:e2e" first.');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

// Flatten suites into a list of test entries
const tests = [];
function walkSuite(suite, parents = []) {
  const crumbs = [...parents, suite.title].filter(Boolean);
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const lastResult = test.results?.[test.results.length - 1] ?? {};
      tests.push({
        file: suite.file ?? crumbs[0] ?? '',
        suite: crumbs.slice(1).join(' › '),
        title: spec.title,
        project: test.projectName ?? '',
        status: test.status ?? lastResult.status ?? 'unknown',
        duration: (test.results ?? []).reduce((sum, r) => sum + (r.duration ?? 0), 0),
        retries: Math.max(0, (test.results?.length ?? 1) - 1),
        error: lastResult.error?.message ?? ''
      });
    }
  }
  for (const child of suite.suites ?? []) walkSuite(child, crumbs);
}
for (const suite of results.suites ?? []) walkSuite(suite);

const counts = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
for (const t of tests) {
  if (t.status in counts) counts[t.status]++;
}
const total = tests.length;
const totalDuration = results.stats?.duration ?? tests.reduce((s, t) => s + t.duration, 0);
const startTime = results.stats?.startTime ? new Date(results.stats.startTime) : new Date();
const allPassed = counts.unexpected === 0;

function fmtDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const statusLabel = {
  expected: 'Passed',
  unexpected: 'Failed',
  flaky: 'Flaky',
  skipped: 'Skipped'
};
const statusColor = {
  expected: '#16a34a',
  unexpected: '#dc2626',
  flaky: '#d97706',
  skipped: '#6b7280'
};

// Group tests by file
const byFile = new Map();
for (const t of tests) {
  if (!byFile.has(t.file)) byFile.set(t.file, []);
  byFile.get(t.file).push(t);
}

const fileSections = [...byFile.entries()]
  .map(([file, fileTests]) => {
    const rows = fileTests
      .map(
        (t) => `
        <tr>
          <td>
            <span class="status-dot" style="background:${statusColor[t.status] ?? '#6b7280'}"></span>
            ${esc(statusLabel[t.status] ?? t.status)}
          </td>
          <td>
            ${t.suite ? `<span class="suite">${esc(t.suite)} › </span>` : ''}${esc(t.title)}
            ${t.retries > 0 ? `<span class="retries">(${t.retries} ${t.retries === 1 ? 'retry' : 'retries'})</span>` : ''}
            ${t.error ? `<pre class="error">${esc(t.error.slice(0, 600))}</pre>` : ''}
          </td>
          <td class="duration">${fmtDuration(t.duration)}</td>
        </tr>`
      )
      .join('');
    const failed = fileTests.filter((t) => t.status === 'unexpected').length;
    return `
      <section class="file-section">
        <h2>${esc(file)} <span class="file-stats">${fileTests.length} tests${failed ? `, <span style="color:#dc2626">${failed} failed</span>` : ''}</span></h2>
        <table>
          <thead><tr><th style="width:90px">Status</th><th>Test</th><th style="width:70px">Time</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
  })
  .join('');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1f2937; padding: 32px; font-size: 12px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #6b7280; margin-bottom: 20px; }
  .banner { padding: 10px 16px; border-radius: 8px; font-size: 15px; font-weight: 600; margin-bottom: 20px; color: #fff;
    background: ${allPassed ? '#16a34a' : '#dc2626'}; }
  .summary { display: flex; gap: 12px; margin-bottom: 28px; }
  .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; text-align: center; }
  .card .num { font-size: 24px; font-weight: 700; }
  .card .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .file-section { margin-bottom: 24px; page-break-inside: avoid; }
  h2 { font-size: 14px; margin-bottom: 8px; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; }
  .file-stats { font-weight: 400; font-size: 11px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; color: #6b7280; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
  .suite { color: #6b7280; }
  .retries { color: #d97706; font-size: 11px; margin-left: 4px; }
  .duration { color: #6b7280; white-space: nowrap; }
  .error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 8px; margin-top: 6px;
    font-family: Menlo, monospace; font-size: 10px; white-space: pre-wrap; word-break: break-word; color: #991b1b; }
</style>
</head>
<body>
  <h1>Playwright E2E Test Report</h1>
  <div class="meta">MPA Database &nbsp;·&nbsp; ${startTime.toLocaleString()} &nbsp;·&nbsp; Total duration: ${fmtDuration(totalDuration)}</div>
  <div class="banner">${allPassed ? '✓ All tests passed' : `✗ ${counts.unexpected} test${counts.unexpected === 1 ? '' : 's'} failed`}</div>
  <div class="summary">
    <div class="card"><div class="num">${total}</div><div class="label">Total</div></div>
    <div class="card"><div class="num" style="color:#16a34a">${counts.expected}</div><div class="label">Passed</div></div>
    <div class="card"><div class="num" style="color:#dc2626">${counts.unexpected}</div><div class="label">Failed</div></div>
    <div class="card"><div class="num" style="color:#d97706">${counts.flaky}</div><div class="label">Flaky</div></div>
    <div class="card"><div class="num" style="color:#6b7280">${counts.skipped}</div><div class="label">Skipped</div></div>
  </div>
  ${fileSections}
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle' });
await page.pdf({
  path: outputPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' }
});
await browser.close();

console.log(`✅ PDF report generated: ${path.relative(process.cwd(), outputPath)}`);
console.log(`   ${total} tests — ${counts.expected} passed, ${counts.unexpected} failed, ${counts.flaky} flaky, ${counts.skipped} skipped`);
