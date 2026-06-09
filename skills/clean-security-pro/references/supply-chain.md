# Supply Chain Security

Source: OWASP A06 (Vulnerable and Outdated Components) and A08 (Software and Data Integrity Failures); CWE-1104 (use of unmaintained third-party components); Spracklen et al., USENIX Security '25 (package hallucination); Lanyado / Lasso Security (AI package-hallucination squatting).

The supply chain is where AI agents are most uniquely dangerous: they suggest package names from memory, and a wrong name is not a harmless error — it is an attacker's opening.

## Contents

- Slopsquatting: the AI-specific threat
- Typosquatting and confusion
- Verifying a new dependency
- Known vulnerabilities (CVEs)
- Lockfiles and pinning
- Install/build scripts
- License risk

## Slopsquatting: the AI-specific threat

**What.** A model confidently recommends a package that does not exist. An attacker who watches for these (they are predictable — 43% of hallucinated names recur across reruns, per USENIX Security '25) registers the exact name on npm/PyPI. The next agent that hallucinates it installs the attacker's code.

**Why it works.** ~19.7% of generated samples reference a hallucinated package. The proof exists: an empty `huggingface-cli` uploaded to PyPI drew 30,000+ real downloads in three months.

**Rule.** Never install or import a package because the model "knows" it exists. Before adding any dependency:
1. Look it up on the **official registry** (npmjs.com, pypi.org, the language's canonical index).
2. Confirm **exact spelling**, a **real publisher/maintainer**, a plausible **age** (not registered last week), and a plausible **download count**.
3. Confirm it is the package you actually want — the CLI you need may live inside a different, well-known package (e.g., the Hugging Face CLI ships in `huggingface_hub`).

A package name that "should exist" but you cannot find is a red flag, not a typo to invent around.

## Typosquatting and confusion

A dependency one character or one separator off a popular package (`reqeusts`, `python3-dateutil`, `lodahs`, scoped-vs-unscoped) may be malicious. Match the name against the real, popular package exactly; be suspicious of a "fork" or "lite" variant you were not told to use.

## Verifying a new dependency

Before a new dependency ships, confirm:

- It exists on the official registry with a real maintainer and history (anti-slopsquat / anti-typosquat).
- It has **no known unpatched CVE** at the chosen version (check the advisory DB / `osv.dev`).
- It is **maintained** (recent releases, open-issue responsiveness) — an abandoned package is CWE-1104.
- It is added through the **lockfile**, at a pinned version.

## Known vulnerabilities (CVEs)

Do not add or keep a dependency with a known, unpatched vulnerability. Prefer the patched version; if none exists, prefer a maintained alternative. The mechanical check is the project's auditor (`npm audit`, `pip-audit`, `osv-scanner`, Dependabot) — this skill's job is to not *introduce* a known-bad version and to not dismiss a real advisory as noise.

## Lockfiles and pinning

- Add dependencies through the package manager so the **lockfile** records exact versions and hashes — do not hand-edit a floating range (`^`, `~`, `*`, `latest`) into a manifest.
- A lockfile with integrity hashes (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`, `Cargo.lock`) is what makes builds reproducible and tamper-evident. Keep it committed and in sync.

## Install/build scripts

- Treat npm `postinstall`/`preinstall` scripts and `pip`/setup hooks as third-party code execution on every install — flag an unfamiliar one.
- Never `curl ... | sh` or `iwr ... | iex` from an unverified source in setup instructions or code. Download, inspect, pin a checksum, then run.
- In CI, pin third-party actions/images to a commit SHA, not a moving tag.

## License risk

A dependency's license is a shipping constraint, not just legal trivia: a copyleft (GPL/AGPL) dependency pulled into a proprietary product, or a package with no license at all, is a real risk worth flagging to the user — even though the final call is theirs, not this skill's.
