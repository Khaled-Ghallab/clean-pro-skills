#!/usr/bin/env node
// Self-verification for the skills in this repo — the dogfood of clean-docs-pro
// Rule 1 (every referenced link resolves) and Rule 6 (no cross-file drift).
// Pure Node, no dependencies. Exits non-zero on any failure.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(repoRoot, "skills");
const failures = [];
const fail = (msg) => failures.push(msg);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const skills = readdirSync(skillsDir).filter((d) =>
  statSync(join(skillsDir, d)).isDirectory()
);

// --- Check 1: every skill has the required structure + frontmatter ---
for (const skill of skills) {
  const skillFile = join(skillsDir, skill, "SKILL.md");
  if (!existsSync(skillFile)) {
    fail(`${skill}: missing SKILL.md`);
    continue;
  }
  const text = readFileSync(skillFile, "utf8");
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    fail(`${skill}/SKILL.md: missing frontmatter block`);
    continue;
  }
  if (!/^name:\s*\S+/m.test(fm[1]))
    fail(`${skill}/SKILL.md: frontmatter missing 'name'`);
  if (!/^description:\s*\S+/m.test(fm[1]))
    fail(`${skill}/SKILL.md: frontmatter missing 'description'`);
  const nameMatch = fm[1].match(/^name:\s*(\S+)/m);
  if (nameMatch && nameMatch[1] !== skill)
    fail(`${skill}/SKILL.md: frontmatter name '${nameMatch[1]}' != directory '${skill}'`);
}

// --- Check 2: every relative .md link in a skill resolves to a real file ---
const linkRe = /\[[^\]]+\]\((references\/[^)#]+\.md)(#[^)]*)?\)/g;
for (const file of walk(skillsDir).filter((f) => f.endsWith(".md"))) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(linkRe)) {
    const target = resolve(dirname(file), m[1]);
    if (!existsSync(target))
      fail(`${file.replace(repoRoot + "/", "")}: dead link -> ${m[1]}`);
  }
}

// --- Check 3: shared stats agree across every file that cites them ---
// The USENIX package-hallucination figure must be ~19.7% wherever it appears.
const allDocs = [
  join(repoRoot, "README.md"),
  ...walk(skillsDir).filter((f) => f.endsWith(".md")),
];
for (const file of allDocs) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  if (/hallucinat/i.test(text) && /\b19\.6\b/.test(text))
    fail(
      `${file.replace(repoRoot + "/", "")}: stale hallucination figure 19.6% (canonical is ~19.7%)`
    );
}

// --- Check 4: no leftover 2021 OWASP ids in the security skill prose ---
const secDir = join(skillsDir, "clean-security-pro");
if (existsSync(secDir)) {
  for (const file of walk(secDir).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(file, "utf8");
    // The 2021->2025 mapping table legitimately names 2021 ids; skip that file.
    if (file.endsWith("owasp-top10.md")) continue;
    for (const m of text.matchAll(/A0\d:2021/g))
      fail(`${file.replace(repoRoot + "/", "")}: stale OWASP id ${m[0]} (use the 2025 id)`);
  }
}

// --- Check 5: clean-test-pro reference files agree on the rule count ---
// SKILL.md defines ten core rules; the per-stack references must not say "nine".
const testDir = join(skillsDir, "clean-test-pro");
if (existsSync(testDir)) {
  for (const file of walk(testDir).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(file, "utf8");
    if (/\bnine (?:core )?rules\b/i.test(text))
      fail(
        `${file.replace(repoRoot + "/", "")}: says "nine rules" — clean-test-pro now has ten`
      );
  }
}

if (failures.length) {
  console.error(`✗ ${failures.length} skill-verification failure(s):\n`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`✓ skills verified: ${skills.length} skills, links + frontmatter + shared stats OK`);
