# OWASP Top 10 (2021)

Source: OWASP Top 10:2021 (owasp.org/Top10). The Top 10 is a consensus ranking of the most critical web-application security risks. For each category: what it is, the smell to flag, and the form AI-generated code takes.

## Contents

- A01 Broken Access Control
- A02 Cryptographic Failures
- A03 Injection
- A04 Insecure Design
- A05 Security Misconfiguration
- A06 Vulnerable and Outdated Components
- A07 Identification and Authentication Failures
- A08 Software and Data Integrity Failures
- A09 Security Logging and Monitoring Failures
- A10 Server-Side Request Forgery (SSRF)

---

## A01 — Broken Access Control

The #1 risk. The user is authenticated but acts on resources they shouldn't.

- **Smell:** an endpoint that loads a resource by an id from the request without checking the current principal owns or may access it (IDOR). A role check on the client only. A "force browse" path (admin route with no server-side role gate).
- **AI form:** the model writes the authentication and skips the authorization — the missing check is invisible in the diff. See [ai-security-failure-modes.md](ai-security-failure-modes.md) #8.
- **Fix:** server-side ownership/permission check at the point of action, against the specific resource. Default-deny.

## A02 — Cryptographic Failures

Sensitive data exposed through missing or weak crypto.

- **Smell:** plaintext secrets at rest, HTTP for sensitive data, `verify=False`, weak hash for passwords, hardcoded keys.
- **AI form:** disables TLS verification to clear an error; hashes passwords with SHA-256; uses a static IV. See [secrets-and-crypto.md](secrets-and-crypto.md).
- **Fix:** TLS everywhere, AEAD encryption, bcrypt/scrypt/argon2 for passwords, keys from a manager.

## A03 — Injection

Untrusted input interpreted as code or query: SQLi, command, LDAP, XSS, SSTI.

- **Smell:** any query/command/markup built by concatenating input; `eval`/`exec` on input; templating with escaping disabled.
- **AI form:** string-built SQL and shell commands are among the most common AI-introduced vulns. See [cwe-and-injection.md](cwe-and-injection.md).
- **Fix:** parameterize, use argument arrays, encode for the output sink, never `eval` input.

## A04 — Insecure Design

The flaw is in the shape of the solution, not a single line — missing rate limits, no trust boundary, fail-open logic.

- **Smell:** an auth/validation/crypto error path that falls through to success; no limit on an expensive or sensitive operation; trusting a value because "the client wouldn't send that."
- **AI form:** fail-open exception handling around a security check.
- **Fix:** fail closed; design the abuse case, not only the happy path.

## A05 — Security Misconfiguration

Insecure defaults, verbose errors, unnecessary features enabled.

- **Smell:** `debug=True` in production, wildcard CORS with credentials, default/blank admin creds, directory listing on, permissive file modes on secrets.
- **AI form:** ships the framework's permissive demo config.
- **Fix:** explicit secure config; least privilege; no debug in production paths.

## A06 — Vulnerable and Outdated Components

Using a dependency with a known vulnerability.

- **Smell:** a pinned version with a published CVE; a floating range that can pull a bad version; an unmaintained package.
- **AI form:** suggests a version from its training cutoff that is now known-vulnerable. See [supply-chain.md](supply-chain.md).
- **Fix:** check the advisory database; pin a patched version through the lockfile.

## A07 — Identification and Authentication Failures

Weak login, session, or credential handling.

- **Smell:** rolled-by-hand auth, no rate limit on login, predictable session ids, JWT decoded-and-trusted without verifying signature/algorithm/expiry, passwords with weak hashing.
- **AI form:** decodes a JWT and reads claims without `verify`; accepts `alg: none`.
- **Fix:** vetted auth library; verify tokens with a pinned algorithm; CSPRNG session ids; strong password hashing.

## A08 — Software and Data Integrity Failures

Trusting code or data without integrity checks; insecure deserialization.

- **Smell:** `pickle`/`yaml.load`/native deserialization of untrusted data; `curl | sh`; unsigned auto-update; unpinned CI action.
- **AI form:** deserializes input into live objects; pipes a remote install script to a shell.
- **Fix:** parse-then-validate plain data; verify integrity/signatures; no remote-script-to-shell.

## A09 — Security Logging and Monitoring Failures

Can't detect or investigate an attack — or the logs themselves leak.

- **Smell:** no audit log on auth events; secrets/PII/tokens written to logs; stack traces returned to the client.
- **AI form:** logs the full request including the password; returns the exception to the user.
- **Fix:** log security events without sensitive payloads; generic errors to users, details server-side.

## A10 — Server-Side Request Forgery (SSRF)

The server makes a request to a URL it shouldn't, controlled by input.

- **Smell:** fetching a URL/host/webhook from input with no allow-list; reachable internal addresses or cloud metadata (`169.254.169.254`).
- **AI form:** a "fetch this URL" helper with no destination validation. See [cwe-and-injection.md](cwe-and-injection.md).
- **Fix:** allow-list destinations; block private/link-local/loopback ranges; no following redirects into them.
