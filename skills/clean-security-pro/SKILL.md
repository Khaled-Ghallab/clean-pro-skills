---
name: clean-security-pro
description: "Review generated or changed code for security vulnerabilities before it ships — injection, broken access control, secrets in code, weak crypto, SSRF, insecure deserialization, unsafe file and network handling, plus AI-specific risks like slopsquatting and overconfident-but-insecure code. Maps findings to OWASP Top 10 and CWE Top 25. Best used reactively after an agent writes, edits, or refactors code that touches untrusted input, auth, data access, file or network I/O, cryptography, or dependencies. Use when the user asks \"is this secure?\", \"security review\", \"check for vulnerabilities\", \"audit this for security\", \"are these dependencies safe?\", or before merging code that handles untrusted input. DO NOT USE for general code-quality review (use clean-code-pro), test review (use clean-test-pro), documentation (use clean-docs-pro), compliance or legal sign-off, penetration testing of running systems, or threat-modeling a design that has no code yet."
---

# clean-security-pro

You are reviewing generated or changed code for security defects before it ships. Apply the rules below as a guard pass after the first implementation pass. Security review is not optional polish — a single injection or missing authorization check is worth more attacker leverage than every style nit in the file combined. Treat any code path that touches untrusted input, authentication, authorization, secrets, cryptography, file or network I/O, or third-party packages as in-scope and guilty until proven safe.

## Compatibility

This is a portable instruction skill. It requires no MCP server, network access,
API key, shell command, local executable, or bundled script. It can be used in
any runtime that supports `SKILL.md` plus directly linked [references/](references/)
files; `agents/openai.yaml` is lightweight display metadata.

This skill does not replace SAST scanners, secret scanners, or dependency
auditors. Use the project's own tools (CodeQL, Semgrep, gitleaks/trufflehog,
`npm audit`/`pip-audit`/`osv-scanner`, Dependabot) for mechanical detection; use
this skill for the judgement layer — what the scanner misses, what it floods,
and which finding actually matters in this code path.

## How to use this skill

This skill has three modes — pick based on the user's request.

**Guard-pass mode** (recommended): after code has been generated, edited, or refactored, check the diff or target files against the _Always-applied imperatives_ below, focusing on every untrusted-input boundary, auth check, secret, and dependency change. Fix or flag violations before presenting, committing, or merging.

**Live mode** (explicit): when the user invokes this skill before writing security-sensitive code, apply the imperatives while writing — parameterize queries, check authorization, keep secrets in config — then run the _Self-check before delivery_.

**Review mode** (triggered when the user asks you to security-review, audit, or assess code): walk [references/review-checklist.md](references/review-checklist.md) against the target file(s) and produce a structured findings report mapped to OWASP/CWE. Do not edit code in review mode unless asked.

The rule bodies live in [references/](references/). Read the relevant reference when:

- You hit a rule and need the OWASP/CWE identifier or the concrete remediation pattern.
- The user pushes back and you need the source citation.
- You're in review mode and need the full checklist.
- The code touches a specific area (injection → [references/cwe-and-injection.md](references/cwe-and-injection.md); secrets/crypto → [references/secrets-and-crypto.md](references/secrets-and-crypto.md); dependencies → [references/supply-chain.md](references/supply-chain.md)).

The reference files are:

- [references/ai-security-failure-modes.md](references/ai-security-failure-modes.md) — the systematic ways LLMs introduce vulnerabilities. **Read this one first if you are an AI agent reading this skill.** It is the highest-leverage file here.
- [references/owasp-top10.md](references/owasp-top10.md) — the OWASP Top 10 (2021) categories with detection smells and the AI-generated form of each.
- [references/cwe-and-injection.md](references/cwe-and-injection.md) — injection, XSS, path traversal, SSRF, deserialization, SSTI — the CWE Top 25 heavy hitters with safe/unsafe pairs.
- [references/secrets-and-crypto.md](references/secrets-and-crypto.md) — hardcoded secrets, key handling, password hashing, weak/rolled-your-own crypto, insecure randomness.
- [references/supply-chain.md](references/supply-chain.md) — slopsquatting, typosquatting, known-CVE dependencies, lockfile integrity, install scripts, license risk.
- [references/review-checklist.md](references/review-checklist.md) — structured walk-through for review mode.
- [references/sources.md](references/sources.md) — central bibliography. Read it only when a URL is needed.

## Why this skill exists

AI-generated code is measurably less secure, and developers using AI assistants are measurably more confident that it is secure — a dangerous combination:

- **~40% of AI-generated programs contained a vulnerability** in security-relevant scenarios (Pearce et al., "Asleep at the Keyboard", IEEE S&P 2022).
- Developers with an AI assistant **wrote less secure code yet believed it was more secure** (Perry et al., "Do Users Write More Insecure Code with AI Assistants?", ACM CCS 2023).
- **Package hallucination averages ~19.7%** across 16 models, and **43% of hallucinated names recur** across reruns — predictable enough to weaponize as *slopsquatting* (Spracklen et al., USENIX Security '25). A single empty proof-of-concept package (`huggingface-cli`) drew **30,000+ real downloads in three months** (Lanyado, Lasso Security).

The classic principles (OWASP, CWE, least privilege, defense in depth) are the foundation. This skill adds the layer where AI agents specifically fail: confidently shipping the insecure-but-plausible pattern, and installing packages that do not exist until an attacker creates them.

## Always-applied imperatives

These are the rules to follow on every security-sensitive change. They are imperative, not suggestions.

### Untrusted input and injection

1. **All untrusted input is hostile until validated.** Treat request params, headers, cookies, file contents, env in multi-tenant contexts, and third-party API responses as attacker-controlled. Validate against an allow-list (shape, type, range, enum) — never a deny-list of "bad" strings. (CWE-20)
2. **Never build a query, command, or path by string concatenation with input.** Use parameterized queries/prepared statements for SQL, argument arrays (never a shell string) for subprocesses, and safe path-join with canonicalization for filesystem access. (CWE-89, CWE-78, CWE-22)
3. **Output is encoded for its sink.** HTML-encode for HTML, attribute-encode for attributes, use the framework's auto-escaping templating, and never build HTML by concatenation or disable escaping (`dangerouslySetInnerHTML`, `\|safe`, `v-html`) on untrusted data. (CWE-79)
4. **No deserialization of untrusted data into live objects.** No `pickle`, `yaml.load` (use `safe_load`), Java/PHP native deserialization, or `eval`/`Function`/`exec` on input. Parse data formats (JSON) into plain structures, then validate. (CWE-502, CWE-94)
5. **Guard every outbound request built from input (SSRF).** A URL, host, or webhook taken from input must be validated against an allow-list and must not reach internal addresses, link-local metadata (`169.254.169.254`), or `localhost`. (CWE-918)

### Authentication and authorization

6. **Every protected action checks authorization at the point of action — server-side.** Never rely on a hidden UI element, a client-side role flag, or "the caller wouldn't send that ID." Verify the current principal owns or may act on the specific resource (no IDOR). (CWE-862, CWE-639, OWASP A01)
7. **Authentication is never rolled by hand when a vetted mechanism exists.** Use the platform/framework auth. Passwords are hashed with bcrypt/scrypt/argon2 (never MD5/SHA-1/SHA-256-alone). Tokens are verified with the library's verify (correct algorithm pinned, signature and expiry checked) — never decoded-and-trusted. (CWE-287, CWE-916)
8. **Fail closed.** On any auth, validation, or crypto error, deny — do not fall through to allow. An exception in an authorization check must not be caught and turned into access. (OWASP A04)

### Secrets and cryptography

9. **No secrets in source.** No API keys, passwords, tokens, private keys, or connection strings as literals — in code, tests, samples, comments, or fixtures. Read them from environment or a secrets manager. A secret that ever touched a commit is compromised; flag it for rotation. (CWE-798)
10. **Use standard crypto, correctly — never invent it.** No homemade ciphers, no ECB mode, no static/zero IV, no reused nonce. Use AEAD (AES-GCM, ChaCha20-Poly1305) via the platform library. (CWE-327)
11. **Randomness for security is cryptographic.** Tokens, session IDs, password-reset codes, and salts use a CSPRNG (`secrets`, `crypto.randomBytes`, `SecureRandom`) — never `Math.random`, `rand()`, or a seeded PRNG. (CWE-338)
12. **Transport and storage are encrypted by default.** HTTPS/TLS for anything over a network; no `verify=False`/disabled cert checks; sensitive data encrypted at rest. (OWASP A02)

### Exposure and misconfiguration

13. **Errors and logs leak nothing.** No stack traces, SQL, internal paths, or secrets in responses. No secrets, tokens, full PII, or raw passwords in logs. Generic message to the user; details to server-side logs only. (CWE-209, OWASP A09)
14. **No insecure defaults.** No `debug=True` in production paths, no wildcard CORS (`Access-Control-Allow-Origin: *`) with credentials, no default/blank admin credentials, no permissive file modes on secrets. (OWASP A05)

### Supply chain

15. **Every new dependency is verified to exist and to be the right one before you import it.** Confirm the package name against the official registry — exact spelling, real publisher, plausible download count and age. AI-suggested package names are a top slopsquatting vector; a name that "should exist" may have been registered by an attacker. (See [references/supply-chain.md](references/supply-chain.md); USENIX Security '25)
16. **Pin and lock.** New dependencies are added through the lockfile, not hand-edited into a manifest with a floating range. Do not add a dependency with a known unpatched CVE; prefer a maintained alternative or a patched version. (OWASP A06, CWE-1104)
17. **No unvetted install/build scripts or remote `curl | sh`.** Treat postinstall scripts and piping a remote script to a shell as code execution from a third party — flag it. (OWASP A08)

### AI-specific guardrails — the highest-leverage section

18. **Plausible is not secure.** The model emits the pattern that looks like working code, which is frequently the insecure one (string-built SQL, `Math.random` token, disabled TLS verify to "make it work"). Re-derive the secure pattern from the rule, do not pattern-match the first thing that runs. (Perry et al., CCS 2023)
19. **Never weaken security to make something pass.** Do not disable cert verification, loosen CORS, widen a permission, comment out an auth check, or add a secret to a fixture so a call or test succeeds. If it only works insecurely, say so and stop. (Asleep at the Keyboard)
20. **Verify the import before you trust it — for existence and for safety.** This is Rule 15 plus clean-code-pro's hallucinated-import rule: an AI-suggested package may not exist (slopsquatting bait) or may be a typosquat one character off a real one. Check the lockfile and the registry, not your memory. (USENIX Security '25)

## Self-check before delivery

Before you show the user security-sensitive code you wrote or edited:

1. Walk imperatives 1–20 against your diff. Fix or flag every violation.
2. For every place untrusted input meets a query, command, path, HTML sink, deserializer, or outbound URL: is it parameterized/encoded/allow-listed?
3. For every protected action: is authorization checked server-side, against the specific resource and current principal?
4. Any secret, key, token, or password as a literal — including in tests, samples, and comments?
5. Any hand-rolled crypto, weak hash for passwords, disabled TLS verification, or `Math.random` for a security value?
6. Any new dependency you did not verify against the registry and add through the lockfile?
7. Did you disable, loosen, or comment out any security control to make the code work? If yes, revert and solve it properly or stop and report.

If you cannot answer safely to every check, fix or flag before shipping.

## When the user pushes back on a rule

Refer them to the OWASP category or CWE id in the relevant [references/](references/) file, with the URL from [references/sources.md](references/sources.md). These are not opinions — they map to OWASP Top 10, CWE Top 25, and published research on AI-assisted code security. A context-specific exception (e.g., a deliberately public read-only endpoint) must be documented in a code comment naming the control and why it is safe here, and downgraded to a documented exception — never silently removed.

## Severity guide

- **Critical** — exploitable now by an unauthenticated or low-privilege attacker: injection, missing authorization/IDOR, secret in source, deserialization of untrusted data, SSRF to internal services, disabled TLS verification.
- **High** — weak crypto/password hashing, insecure randomness for security values, known-CVE dependency, slopsquatting/typosquat risk, sensitive data in logs or errors.
- **Medium** — insecure defaults, missing security headers, overly broad CORS, verbose errors without direct secret exposure.
- **Low / note** — defense-in-depth hardening, rate-limiting suggestions, observability for security events.

## What this skill does not do

- Run SAST, secret scanners, or dependency auditors — those are tooling; this skill is the judgement layer over their output and gaps.
- Perform penetration testing or exploit a running system — it reviews code, not live infrastructure.
- Provide legal, compliance, or regulatory sign-off (PCI, HIPAA, GDPR) — it reduces vulnerability risk, it does not certify.
- Replace a human security review for high-stakes systems — it raises the floor; it is not the ceiling.
