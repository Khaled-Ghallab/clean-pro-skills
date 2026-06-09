# OWASP Top 10 (2025)

Source: OWASP Top 10:2025 (owasp.org/Top10/2025/), the final release. The Top 10 is a consensus ranking of the most critical web-application security risks. For each category: what it is, the smell to flag, and the form AI-generated code takes. A 2021→2025 mapping table is at the end for older findings and tooling that still reports 2021 ids.

## Contents

- A01 Broken Access Control (now includes SSRF)
- A02 Security Misconfiguration
- A03 Software Supply Chain Failures
- A04 Cryptographic Failures
- A05 Injection
- A06 Insecure Design
- A07 Authentication Failures
- A08 Software or Data Integrity Failures
- A09 Security Logging and Alerting Failures
- A10 Mishandling of Exceptional Conditions
- Mapping 2021 → 2025

---

## A01 — Broken Access Control

The #1 risk. The user is authenticated but acts on resources they shouldn't. **2025 change: SSRF (the 2021 A10) is folded into this category** — the server reaching internal resources on behalf of an attacker is an access-control failure.

- **Smell:** an endpoint that loads a resource by an id from the request without checking the current principal owns or may access it (IDOR). A role check on the client only. A "force browse" path (admin route with no server-side role gate). A URL/host/webhook taken from input that can reach internal addresses or cloud metadata (`169.254.169.254`).
- **AI form:** the model writes the authentication and skips the authorization — the missing check is invisible in the diff. "Fetch this URL" helpers ship with no destination validation. See [ai-security-failure-modes.md](ai-security-failure-modes.md) #8 and [cwe-and-injection.md](cwe-and-injection.md) (SSRF).
- **Fix:** server-side ownership/permission check at the point of action, against the specific resource. Default-deny. Allow-list outbound destinations; block private/link-local ranges.

## A02 — Security Misconfiguration

Insecure defaults, verbose errors, unnecessary features enabled. **Moved up from #5 in 2021** — misconfiguration is now the second most common root cause.

- **Smell:** `debug=True` in production, wildcard CORS with credentials, default/blank admin creds, directory listing on, permissive file modes on secrets, missing security headers.
- **AI form:** ships the framework's permissive demo config.
- **Fix:** explicit secure config; least privilege; no debug in production paths.

## A03 — Software Supply Chain Failures

**New in 2025**, broadened from 2021's "Vulnerable and Outdated Components": compromise anywhere in the path code takes from a third party into your build — dependencies, build systems, registries, CI/CD, distribution.

- **Smell:** a pinned version with a published CVE; a floating range that can pull a bad version; an unmaintained package; an unpinned CI action or base image; an unfamiliar install script.
- **AI form:** the highest-leverage AI risk in the whole Top 10 — hallucinated package names (slopsquatting), typosquats, and versions suggested from a stale training cutoff. See [supply-chain.md](supply-chain.md).
- **Fix:** verify every new dependency on the official registry; pin through the lockfile; check the advisory database; pin CI actions to a commit SHA.

## A04 — Cryptographic Failures

Sensitive data exposed through missing or weak crypto (was A02 in 2021).

- **Smell:** plaintext secrets at rest, HTTP for sensitive data, `verify=False`, weak hash for passwords, hardcoded keys, non-constant-time secret comparison.
- **AI form:** disables TLS verification to clear an error; hashes passwords with SHA-256; uses a static IV. See [secrets-and-crypto.md](secrets-and-crypto.md).
- **Fix:** TLS everywhere, AEAD encryption, argon2id/bcrypt/scrypt/PBKDF2 for passwords, keys from a manager, constant-time comparison for secrets.

## A05 — Injection

Untrusted input interpreted as code or query: SQLi, command, LDAP, XSS, SSTI (was A03 in 2021 — lower rank, still ubiquitous in AI output).

- **Smell:** any query/command/markup built by concatenating input; `eval`/`exec` on input; templating with escaping disabled.
- **AI form:** string-built SQL and shell commands are among the most common AI-introduced vulns. See [cwe-and-injection.md](cwe-and-injection.md).
- **Fix:** parameterize, use argument arrays, encode for the output sink, never `eval` input.

## A06 — Insecure Design

The flaw is in the shape of the solution, not a single line — missing rate limits, no trust boundary, no abuse case considered.

- **Smell:** no limit on an expensive or sensitive operation (uploads, exports, login attempts, LLM/agent loops); trusting a value because "the client wouldn't send that"; a check-then-act race on a balance or inventory (TOCTOU).
- **AI form:** implements exactly the happy path the prompt described; never adds the limit or the abuse case unprompted.
- **Fix:** design the abuse case; bound every resource (size, count, rate, cost); make check-and-act atomic.

## A07 — Authentication Failures

Weak login, session, or credential handling (renamed from "Identification and Authentication Failures").

- **Smell:** rolled-by-hand auth, no rate limit on login, predictable session ids, JWT decoded-and-trusted without verifying signature/algorithm/expiry, passwords with weak hashing, state-changing endpoints without CSRF protection.
- **AI form:** decodes a JWT and reads claims without `verify`; accepts `alg: none`; exempts a route from CSRF middleware "to make the form work".
- **Fix:** vetted auth library; verify tokens with a pinned algorithm; CSPRNG session ids; strong password hashing; CSRF tokens + `SameSite` cookies on state-changing routes.

## A08 — Software or Data Integrity Failures

Trusting code or data without integrity checks (the supply-chain half of the 2021 category moved to A03; what remains is integrity of data and updates).

- **Smell:** `pickle`/`yaml.load`/native deserialization of untrusted data; `curl | sh`; unsigned auto-update; loading untrusted model weights with a pickle-based loader.
- **AI form:** deserializes input into live objects; pipes a remote install script to a shell.
- **Fix:** parse-then-validate plain data; verify integrity/signatures; no remote-script-to-shell.

## A09 — Security Logging and Alerting Failures

Can't detect, alert on, or investigate an attack — or the logs themselves leak (renamed from "Monitoring" to emphasize alerting).

- **Smell:** no audit log on auth events; nothing fires when auth failures spike; secrets/PII/tokens written to logs; stack traces returned to the client.
- **AI form:** logs the full request including the password; returns the exception to the user.
- **Fix:** log security events without sensitive payloads; alert on auth anomalies; generic errors to users, details server-side.

## A10 — Mishandling of Exceptional Conditions

**New in 2025**: improper error handling, fail-open logic, swallowed exceptions, and logic errors under abnormal conditions — the security face of clean-code-pro's catch-all rule.

- **Smell:** an auth, validation, or crypto error path that falls through to success; a broad catch around a security check that returns a default-allow; an unhandled error that leaves a half-completed privileged operation.
- **AI form:** the highest-affinity category for LLM output — models systematically wrap risky operations in broad handlers that suppress the failure, turning "the check crashed" into "the check passed". See [ai-security-failure-modes.md](ai-security-failure-modes.md) #3.
- **Fix:** fail closed. An exception in a security control denies. Catch only what you can recover from, and never recover into an allow.

---

## Mapping 2021 → 2025

| 2021 | 2025 |
|---|---|
| A01 Broken Access Control | A01 (unchanged, absorbs SSRF) |
| A02 Cryptographic Failures | A04 |
| A03 Injection | A05 |
| A04 Insecure Design | A06 |
| A05 Security Misconfiguration | A02 |
| A06 Vulnerable and Outdated Components | A03 Software Supply Chain Failures (broadened) |
| A07 Identification and Authentication Failures | A07 Authentication Failures (renamed) |
| A08 Software and Data Integrity Failures | A08 Software or Data Integrity Failures (supply-chain parts → A03) |
| A09 Security Logging and Monitoring Failures | A09 Security Logging and Alerting Failures (renamed) |
| A10 Server-Side Request Forgery | merged into A01 |
| — | A10 Mishandling of Exceptional Conditions (new) |
