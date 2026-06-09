# Secrets and Cryptography

Source: CWE-798 (hard-coded credentials), CWE-327 (broken/risky crypto), CWE-916 (weak password hash), CWE-338 (weak PRNG), CWE-208 (observable timing discrepancy); OWASP Secrets Management, Password Storage, and Cryptographic Storage Cheat Sheets.

## Contents

- Secrets: never in source
- Detecting a committed secret
- Password hashing
- Encryption: use AEAD, never invent
- Randomness: CSPRNG for security
- Comparing secrets: constant time
- Tokens and JWT
- TLS and transport

## Secrets: never in source

No API key, password, token, private key, OAuth secret, or connection string as a literal — in code, config committed to the repo, tests, samples, comments, or fixtures.

```text
# Unsafe
API_KEY = "sk_live_51H..."
DATABASE_URL = "postgres://admin:hunter2@prod-db/app"
# Safe
API_KEY = os.environ["API_KEY"]
DATABASE_URL = os.environ["DATABASE_URL"]   # injected by the secret manager / CI
```

Placeholders in examples must be unmistakable: `YOUR_API_KEY`, `sk_test_PLACEHOLDER`, `example.com`. Never a real-looking value — it trains readers to paste theirs and trips secret scanners.

## Detecting a committed secret

Flag as Critical, and say so plainly: **a secret that ever reached a commit is compromised and must be rotated** — removing it in a later commit does not undo the exposure; it remains in history. Recommend rotation, not just deletion.

Heuristics: high-entropy strings, known prefixes (`sk_`, `AKIA`, `ghp_`, `xoxb-`, `-----BEGIN ... PRIVATE KEY-----`), `password=`/`secret=`/`token=` with a literal value. The project's secret scanner (gitleaks, trufflehog) is the mechanical floor.

## Password hashing

Passwords use a slow, salted, purpose-built hash. Never a general-purpose fast hash.

```text
# Unsafe
md5(pw)   sha1(pw)   sha256(pw)            # fast → crackable at billions/sec
# Safe — OWASP Password Storage Cheat Sheet order of preference
argon2id(pw)                               # first choice
scrypt(pw)   bcrypt(pw)                    # solid alternatives
pbkdf2(pw, iterations=current_owasp_floor) # FIPS contexts and Web Crypto-only
                                           # runtimes (edge/workers) — keep the
                                           # iteration count at the current
                                           # OWASP-recommended floor
```

Verify with the library's constant-time `verify`. Do not invent a salt-and-pepper scheme around a fast hash. A raw single-pass `sha256(pw)` is never acceptable; PBKDF2-SHA256 with a current iteration count is.

## Encryption: use AEAD, never invent

```text
# Unsafe
AES.MODE_ECB                  # identical plaintext → identical ciphertext
static / zero IV              # defeats CBC/CTR
reused nonce with GCM         # catastrophic for AES-GCM
home-made "XOR cipher"
# Safe
AES-GCM or ChaCha20-Poly1305  # AEAD: confidentiality + integrity
unique random nonce per message, via the platform crypto library
```

Authenticated encryption (AEAD) by default — plain CBC without a MAC invites padding-oracle attacks.

## Randomness: CSPRNG for security

Any value whose unpredictability matters — tokens, session ids, password-reset codes, salts, nonces — uses a cryptographic RNG.

```text
# Unsafe
random.random()   Math.random()   rand()   seeded PRNG
# Safe
secrets.token_urlsafe(32)        # Python
crypto.randomBytes(32)           # Node
SecureRandom                     # Java
```

## Comparing secrets: constant time

`==` on secret material returns early at the first differing byte — the response time leaks how much of the value matched (CWE-208). Any comparison of tokens, MACs, signatures, API keys, or OTPs uses a constant-time compare.

```text
# Unsafe
if token == stored_token: ...
if computed_hmac == received_hmac: ...
# Safe
hmac.compare_digest(token, stored_token)    # Python
crypto.timingSafeEqual(a, b)                # Node
hash_equals($a, $b)                         # PHP
```

## Tokens and JWT

- Verify, never just decode: check signature, pin the expected algorithm (reject `alg: none` and algorithm-confusion), check `exp`/`nbf`/audience/issuer.
- Don't put secrets or sensitive PII in a JWT payload — it is signed, not encrypted; anyone can read it.
- Session ids and bearer tokens are CSPRNG-generated and stored/transmitted securely.

```text
# Unsafe
claims = jwt.decode(token, options={"verify_signature": False})
# Safe
claims = jwt.decode(token, key, algorithms=["RS256"])   # signature + exp enforced
```

## TLS and transport

- HTTPS/TLS for anything sensitive over a network. Never `verify=False` / `rejectUnauthorized: false` / disabled hostname check to clear a cert error — fix the CA bundle or hostname instead.
- HSTS for browser-facing services; secure + httpOnly + sameSite on session cookies.
