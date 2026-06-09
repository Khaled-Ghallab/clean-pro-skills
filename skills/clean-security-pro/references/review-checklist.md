# Security Review Checklist

When the user asks you to **security-review, audit, or assess** code (rather than write it), follow this structured walk. Do not edit code unless asked. Produce a findings report mapped to OWASP/CWE.

## Contents

- Output format
- Pre-flight: map the attack surface
- Walk order
- What to do with each finding
- When the review is contested

## Output format

```
# Security review: <file or scope>

## Summary
<2–3 sentence verdict: ship / fix-first / do-not-ship — and the headline risk>

## Critical findings
<exploitable now — fix before merge>
- **<short title>** — `<file>:<line>`
  Evidence: <quoted code / data flow from source to sink>
  Class: <OWASP A0x / CWE-xx>
  Impact: <what an attacker gains>
  Fix: <concrete remediation>

## High findings
- ...

## Medium / hardening
- ...

## What's solid
<controls done right — parameterized queries, real authz, secrets in env>

## Coverage
- [ ] Untrusted-input boundaries (injection, SSRF, deserialization, mass assignment)
- [ ] Authentication and authorization (incl. IDOR / missing checks / CSRF)
- [ ] Secrets and cryptography
- [ ] Misconfiguration, data exposure, and resource limits
- [ ] Dependencies / supply chain
- [ ] LLM application risks (if the code calls an LLM)
- [ ] AI-specific failure modes
```

Severity uses the SKILL.md guide (Critical / High / Medium / Low). Lead with what an unauthenticated or low-privilege attacker can exploit today.

## Pre-flight: map the attack surface

Before walking rules, identify where untrusted data enters and where it lands:

- **Sources:** request params/body/headers/cookies, uploaded files, query strings, third-party API responses, message-queue payloads, env in multi-tenant contexts, LLM/model outputs, retrieved RAG documents.
- **Sinks:** SQL/NoSQL queries, shell/subprocess, filesystem paths, HTML/template output, deserializers, outbound HTTP, redirects, `eval`-family, LLM prompts, agent tool calls.
- **Trust boundaries:** auth checks, authorization checks, input validation. Note where a source reaches a sink without crossing one — that path is the review's spine.

## Walk order

1. **Injection & input** ([cwe-and-injection.md](cwe-and-injection.md)) — trace each source→sink path: parameterized? encoded? allow-listed? canonicalized? No `eval`/unsafe-deserialize on input? Request bodies bound to explicit fields (no mass assignment)? Any regex on untrusted input backtracking-safe?
2. **Access control** ([owasp-top10.md](owasp-top10.md) A01) — for each protected action, is there a server-side ownership/permission check against the specific resource? Flag the *absent* check (IDOR), not just the wrong one. Outbound URLs from input allow-listed (SSRF, open redirect)?
3. **Auth & sessions** (A07) — vetted mechanism? Tokens verified (signature, algorithm pinned, expiry)? Strong password hashing? Rate limiting on login? CSRF protection on cookie-authenticated state changes, `SameSite` cookies, no state change on GET?
4. **Secrets & crypto** ([secrets-and-crypto.md](secrets-and-crypto.md)) — any literal secret (incl. tests/samples/prompts)? Weak hash, invented crypto, static IV, `Math.random` for a security value, `==` on a token, disabled TLS verify?
5. **Misconfig, exposure & limits** (A02/A09/A06) — debug on, wildcard CORS, default creds, stack traces or secrets in errors/logs? Unbounded uploads, loops, or expensive operations? Check-then-act races on money/inventory/tokens? Fail-open error handling around any security control (A10)?
6. **Supply chain** ([supply-chain.md](supply-chain.md), A03) — new dependency verified on the registry (anti-slopsquat)? Pinned via lockfile? Known CVE? Unvetted install script?
7. **LLM application code** ([llm-app-security.md](llm-app-security.md)) — if the code calls an LLM: model output reaching SQL/shell/HTML/`eval` unencoded? Tools running beyond the end user's permissions? Secrets in prompts? Uncapped agent loops or token budgets? RAG queries missing the tenant filter?
8. **AI failure modes** ([ai-security-failure-modes.md](ai-security-failure-modes.md)) — any plausible-but-insecure pattern, any security control weakened "to make it work", any hallucinated/typosquat import?

## What to do with each finding

1. Quote the code and, for injection/SSRF, the **data flow** from source to sink (that flow is the proof).
2. Name the class (OWASP A0x / CWE-id).
3. State the attacker impact in one line — this drives severity.
4. Give a concrete fix.
5. Assign severity from the SKILL.md guide.

A finding without a plausible exploit path is a hardening note, not a Critical — say which it is. Don't inflate; a flood of theoretical findings buries the one that matters.

## When the review is contested

Cite the OWASP category or CWE id and its URL from [sources.md](sources.md). For a deliberate, safe exception (a genuinely public read-only endpoint; a "secret" that is a public client id), require a code comment naming the control and why it is safe here, and downgrade to a documented exception rather than dropping it.
