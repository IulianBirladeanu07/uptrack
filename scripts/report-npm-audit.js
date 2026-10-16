const { spawnSync } = require("node:child_process");
const { appendFileSync } = require("node:fs");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["audit", "--omit=dev", "--json"], {
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  throw new Error(
    `npm audit did not return valid JSON (exit ${result.status}). ${result.stderr.trim()}`,
  );
}

if (!report.metadata?.vulnerabilities || ![0, 1].includes(result.status)) {
  throw new Error(
    `npm audit failed without a vulnerability report (exit ${result.status}). ${result.stderr.trim()}`,
  );
}

const { critical, high, moderate, low, total } = report.metadata.vulnerabilities;
const summary = [
  "## Production dependency audit",
  "",
  "| Total | Critical | High | Moderate | Low |",
  "|------:|---------:|-----:|---------:|----:|",
  `| ${total} | ${critical} | ${high} | ${moderate} | ${low} |`,
  "",
  "This report is informational; review advisories and plan compatible upgrades before release.",
  "",
].join("\n");

console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
