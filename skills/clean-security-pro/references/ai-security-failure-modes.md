# AI Security Failure Modes — the unique value of this skill

This file catalogs the systematic ways LLMs introduce *security* defects — distinct from the general quality failures in clean-code-pro. Read this first if you are an AI agent applying this skill. Each mode has a root cause, a source, a bad/good pair, and the imperative for your self-check.

The cross-cutting root cause: **the model emits the most statistically common pattern, and the most common pattern in its training data is frequently insecure.** Secure code is the minority class. Restraint and re-derivation — not more code — are the cure.

## Contents

- 1. Plausible-but-insecure code (the master failure)
- 2. Slopsquatting and hallucinated dependencies
- 3. Weakening security to "make it work"
- 4. String-built queries, commands, and paths
- 5. Secrets written into source, tests, and samples
- 6. Insecure randomness for security values
- 7. Rolled-by-hand or misused crypto
- 8. Missing authorization (the check that is simply absent)
- 9. Copy-from-insecure-example
- 10. Overconfidence and the silent-vuln problem

---

## 1. Plausible-but-insecure code (the master failure)

**Pattern.** The model produces code that compiles, runs, and passes the happy path — and is insecure in exactly the way the common-but-wrong tutorial was.

**Source.** Perry et al., "Do Users Write More Insecure Code with AI Assistants?" (ACM CCS 2023) — participants with an AI assistant wrote *less* secure code on four of five tasks. Pearce et al., "Asleep at the Keyboard" (IEEE S&P 2022) — ~40% of generated programs were vulnerable.

**Bad:**
```text
query = "SELECT * FROM users WHERE email = '" + email + "'"
db.execute(query)
```
Runs. Demos fine. Is a SQL injection.

**Good:**
```text
db.execute("SELECT * FROM users WHERE email = ?", [email])
```

**Rule.** When you write security-sensitive code, re-derive the secure pattern from the rule (parameterize, encode, allow-list, authorize) instead of emitting the first thing that runs.

---

## 2. Slopsquatting and hallucinated dependencies

**Pattern.** The model recommends a package name that does not exist. An attacker pre-registers that exact name on npm/PyPI; the next agent that hallucinates it installs malware.

**Source.** Spracklen et al., USENIX Security '25 — ~19.7% package-hallucination rate; **43% of hallucinated names recur** across reruns, making them predictable targets. Term "slopsquatting" coined by Seth Larson (2025). Bar Lanyado / Lasso Security uploaded an empty `huggingface-cli` to PyPI — **30,000+ real downloads in three months**.

**Bad:**
```text
pip install huggingface-cli   # name the model invented; attacker now owns it
import langchain_helpers       # plausible, nonexistent — until someone registers it
```

**Good:**
```text
# Verify against the official registry before installing:
#   exact name, real publisher, plausible age + downloads.
# huggingface CLI ships inside `huggingface_hub` — use that.
pip install huggingface_hub
```

**Rule.** Never install or import a package on the strength of the model's memory. Confirm exact spelling, publisher, age, and download count on the official registry; add it through the lockfile.

---

## 3. Weakening security to "make it work"

**Pattern.** Hitting a TLS error, a CORS block, or a permission denial, the model removes the control instead of fixing the cause.

**Source.** Field-documented across AI-assisted development; the same reward-shaping that makes models suppress exceptions (Karpathy, cited in clean-code-pro) makes them suppress security friction.

**Bad:**
```text
requests.get(url, verify=False)            # cert error → disable verification
Access-Control-Allow-Origin: *             # CORS block → allow everyone
# auth_required()                          # 403 in tests → comment it out
```

**Good:**
```text
requests.get(url)                          # fix the CA bundle / hostname instead
Access-Control-Allow-Origin: https://app.example.com
auth_required()                            # keep it; fix the test's credentials
```

**Rule.** Never disable cert verification, widen CORS, loosen a permission, or comment out an auth check to clear an error. If it only works insecurely, stop and report.

---

## 4. String-built queries, commands, and paths

**Pattern.** Building SQL, shell commands, or filesystem paths by concatenating input — the single most common AI-introduced injection.

**Source.** CWE-89 (SQLi), CWE-78 (OS command injection), CWE-22 (path traversal) — all in the CWE Top 25; all over-produced by code LLMs.

**Bad:**
```text
os.system("convert " + filename + " out.png")   # filename = "x; rm -rf /"
open(base_dir + "/" + user_path)                 # user_path = "../../etc/passwd"
```

**Good:**
```text
subprocess.run(["convert", filename, "out.png"])           # argument array, no shell
safe = os.path.realpath(os.path.join(base_dir, user_path))
if not safe.startswith(os.path.realpath(base_dir) + os.sep): reject()
# the trailing separator matters: without it, "/uploads-evil" passes a "/uploads" check
```

**Rule.** Parameterize SQL, pass subprocess arguments as an array (never a shell string), and canonicalize-then-verify any path built from input.

---

## 5. Secrets written into source, tests, and samples

**Pattern.** A real-looking key, password, or token hardcoded — most often in a test fixture, an example, or a "temporary" default the model never removes.

**Source.** CWE-798 (hard-coded credentials). Secret-scanner data shows test and sample files are where committed secrets hide.

**Bad:**
```text
STRIPE_KEY = "sk_live_51H...real..."
client = Client(api_key="AKIA...realsecret...")   # even in a test, it is leaked
```

**Good:**
```text
STRIPE_KEY = os.environ["STRIPE_KEY"]
client = Client(api_key=os.environ["PAYMENT_API_KEY"])
# tests use an obvious placeholder: "sk_test_PLACEHOLDER"
```

**Rule.** No secret as a literal anywhere — code, tests, samples, comments. Read from env/secret manager. Any secret that touched a commit is compromised; flag it for rotation.

---

## 6. Insecure randomness for security values

**Pattern.** Generating tokens, session IDs, reset codes, or salts with a fast non-cryptographic PRNG.

**Source.** CWE-338 (use of cryptographically weak PRNG).

**Bad:**
```text
token = str(random.random())[2:]      # predictable
otp   = Math.floor(Math.random()*1e6) // guessable in milliseconds
```

**Good:**
```text
token = secrets.token_urlsafe(32)
otp   = crypto.randomInt(0, 1_000_000)   // CSPRNG
```

**Rule.** Any value whose unpredictability is a security property uses a CSPRNG (`secrets`, `crypto.randomBytes`/`randomInt`, `SecureRandom`).

---

## 7. Rolled-by-hand or misused crypto

**Pattern.** Inventing encryption, hashing passwords with a fast general hash, or misusing a primitive (ECB mode, static IV, reused nonce).

**Source.** CWE-327 (broken/risky crypto algorithm), CWE-916 (weak password hash).

**Bad:**
```text
hashlib.sha256(password).hexdigest()      # fast hash → crackable at scale
AES.new(key, AES.MODE_ECB)                // leaks plaintext structure
```

**Good:**
```text
argon2.hash(password)                     # or bcrypt / scrypt
AES.new(key, AES.MODE_GCM)                // AEAD; unique nonce per message
```

**Rule.** Never invent crypto. Hash passwords with bcrypt/scrypt/argon2; encrypt with an AEAD mode and a unique nonce, via the platform library.

---

## 8. Missing authorization (the check that is simply absent)

**Pattern.** The endpoint authenticates the user but never checks whether *this* user may act on *this* resource — the gap is an absence, so it is invisible in a diff.

**Source.** OWASP A01:2025 Broken Access Control (the #1 category); CWE-862 (missing authorization), CWE-639 (IDOR).

**Bad:**
```text
GET /api/invoices/{id}
  invoice = db.get(id)        # any logged-in user reads any invoice
  return invoice
```

**Good:**
```text
GET /api/invoices/{id}
  invoice = db.get(id)
  if invoice.owner_id != current_user.id: deny(403)
  return invoice
```

**Rule.** For every protected action, look for the *absence* of an ownership/permission check, server-side, against the specific resource. Missing is the default failure.

---

## 9. Copy-from-insecure-example

**Pattern.** The model lifts a snippet from a tutorial/StackOverflow-style answer that prioritized brevity over safety, importing the vulnerability with it.

**Source.** Same mechanism as clean-code-pro's "copy-from-similar"; insecure examples are over-represented in training data because they are shorter.

**Rule.** When a generated block resembles boilerplate from a tutorial (auth, file upload, query, crypto), assume it carries the tutorial's shortcut. Verify each control is present, not just that it runs.

---

## 10. Overconfidence and the silent-vuln problem

**Pattern.** AI-assisted code ships with confident comments and clean structure that signal safety the code does not have — and the author, per Perry et al., believes it more than unaided code.

**Source.** Perry et al., CCS 2023 — overconfidence is the measured second-order effect.

**Rule.** Confidence in the prose is not evidence of safety in the code. Apply the checklist regardless of how finished the code looks; the most dangerous vulnerabilities are the well-commented ones.

---

## Where this skill differs from clean-code-pro

clean-code-pro catches *quality* failures (some overlap: hallucinated imports, swallowed errors). This file catches *exploitable* failures: the difference between "this function is ugly" and "this function lets an unauthenticated user read every invoice." When both skills flag the same line, security severity wins.
