const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
if (!fs.existsSync(file)) {
  console.error('coverage-summary.json not found');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(file, 'utf8'));
const { total } = summary;
const pct = m => `${m.pct}% (${m.covered}/${m.total})`;
const rel = f => path.relative(process.cwd(), f).split(path.sep).join('/');

const lowest = Object.entries(summary)
  .filter(([name, v]) => name !== 'total' && v.lines.total >= 25)
  .sort((a, b) => a[1].lines.pct - b[1].lines.pct)
  .slice(0, 10);

const out = [
  '## Jest coverage (informational)',
  '',
  'Scope: `src/**/*.{js,ts}` only. `.tsx` screens and components are not instrumented, so this is not whole-app coverage. Style, type and test files are excluded.',
  '',
  '| Metric | Covered |',
  '|---|---|',
  `| Lines | ${pct(total.lines)} |`,
  `| Branches | ${pct(total.branches)} |`,
  `| Functions | ${pct(total.functions)} |`,
  `| Statements | ${pct(total.statements)} |`,
  '',
  'Lowest line coverage among files with at least 25 lines:',
  '',
  '| File | Lines | Branches |',
  '|---|---|---|',
  ...lowest.map(([name, v]) => `| \`${rel(name)}\` | ${v.lines.pct}% | ${v.branches.pct}% |`),
  '',
];

process.stdout.write(out.join('\n'));
