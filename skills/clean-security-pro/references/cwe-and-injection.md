# Injection and the CWE Top 25 Heavy Hitters

Source: 2025 CWE Top 25 Most Dangerous Software Weaknesses (cwe.mitre.org/top25/). In the 2025 ranking XSS is #1, SQL injection #2, and CSRF #3 — three of the top four are exactly the classes AI agents over-produce. This file gives safe/unsafe pairs for the weaknesses most likely to appear in generated code. Language is pseudocode; map to your stack's safe API.

## Contents

- SQL injection (CWE-89)
- NoSQL / query-operator injection (CWE-943)
- OS command injection (CWE-78)
- Cross-site scripting (CWE-79)
- Cross-site request forgery (CWE-352)
- Path traversal (CWE-22)
- Server-side request forgery (CWE-918)
- Open redirect (CWE-601)
- Insecure deserialization (CWE-502)
- XML external entities (CWE-611)
- Code injection / eval (CWE-94)
- Server-side template injection
- Mass assignment (CWE-915)
- Regular-expression denial of service (CWE-1333)
- Unbounded resource consumption (CWE-770)
- Race conditions / TOCTOU (CWE-362)
- Improper input validation (CWE-20)

---

## SQL injection — CWE-89

Never concatenate. Parameterize. This includes `LIKE` patterns, `IN` lists, and `ORDER BY` (validate column names against an allow-list — they cannot be parameters).

```text
# Unsafe
db.execute("SELECT * FROM t WHERE name = '" + name + "'")
# Safe
db.execute("SELECT * FROM t WHERE name = ?", [name])
# ORDER BY column cannot be a bind param — allow-list it:
if sort_col not in {"name", "created_at"}: reject()
```

ORMs are not automatically safe: raw-query escapes, string-interpolated `where`, and `extra()`/`raw()` reintroduce injection.

## NoSQL / query-operator injection — CWE-943

Document stores interpret objects as operators. A request body that arrives as an object instead of a string rewrites the query.

```text
# Unsafe — body {"password": {"$gt": ""}} matches every user
users.findOne({user: req.body.user, password: req.body.password})
# Safe — enforce scalar types at the boundary, then query
if typeof req.body.password != "string": reject()
users.findOne({user: req.body.user, password: req.body.password})
```

Reject operator keys (`$where`, `$gt`, `$ne`, `$regex`) in user-supplied values; validate shape before the query, not after.

## OS command injection — CWE-78

Never pass a built string to a shell. Use an argument array; avoid the shell entirely.

```text
# Unsafe
os.system("ping " + host)
subprocess.run("ping " + host, shell=True)
# Safe
subprocess.run(["ping", "-c", "1", host])   # no shell, host is one argument
```

If a shell is unavoidable, the input must be allow-listed, not escaped.

## Cross-site scripting — CWE-79

\#1 in the 2025 CWE Top 25. Encode for the sink; rely on the framework's auto-escaping; never inject untrusted data into a raw-HTML API.

```text
# Unsafe
element.innerHTML = userInput
dangerouslySetInnerHTML={{__html: userInput}}
template: "<div>" + userInput + "</div>"   // or |safe / v-html on untrusted data
# Safe
element.textContent = userInput
{userInput}                                 // JSX auto-escapes
// If HTML is required, sanitize with a vetted library (DOMPurify) first.
```

A strict Content-Security-Policy is defense in depth, not a substitute for encoding.

## Cross-site request forgery — CWE-352

\#3 in the 2025 CWE Top 25. A state-changing endpoint that relies only on a session cookie can be triggered by any site the victim visits.

```text
# Unsafe
POST /transfer   authenticated by session cookie alone
GET  /delete-account?id=7          # state change on GET — always wrong
csrf_exempt(view)                  # exempted "to make the form work"
# Safe
POST /transfer with the framework's CSRF token middleware enabled
Set-Cookie: session=...; SameSite=Lax; Secure; HttpOnly
# state changes only on POST/PUT/DELETE, never GET
```

Use the framework's CSRF protection — never roll your own and never exempt routes to clear an error. `SameSite` is defense in depth, not a replacement for tokens (subdomains, older clients). Pure-bearer-token APIs (no cookies) are not CSRF-able; cookie-authenticated ones are.

## Path traversal — CWE-22

Canonicalize, then verify the result stays inside the base directory — including the trailing separator, or `/base-evil` passes a `/base` prefix check.

```text
# Unsafe
open(base + "/" + user_path)                # "../../etc/passwd"
# Safe
full = realpath(join(base, user_path))
if not full.startswith(realpath(base) + sep): reject()
open(full)
```

## Server-side request forgery — CWE-918

Validate the destination of any request built from input (mapped to A01 in OWASP Top 10:2025).

```text
# Unsafe
fetch(request.query.url)                     # attacker → http://169.254.169.254/...
# Safe
host = parse(url).host
ip = resolve(host)
if not allowlisted(host) or is_private_or_linklocal(ip): reject()
fetch_via_pinned_ip(url, ip, allow_redirects=False)
# connect to the ip you validated — re-resolving at fetch time reopens
# the hole via DNS rebinding; re-validate after any redirect you follow
```

Block loopback, RFC1918 private ranges, link-local (`169.254.0.0/16`, incl. cloud metadata), and IPv6 equivalents. If the HTTP client cannot pin the resolved IP, validate inside its connection/DNS hook rather than before the call.

## Open redirect — CWE-601

A redirect target taken from input (`?next=`, `?return_to=`) becomes a phishing springboard wearing your domain.

```text
# Unsafe
redirect(request.query.next)                 # ?next=https://evil.example
# Safe
target = request.query.next or "/"
if not target.startswith("/") or target.startswith("//"): target = "/"
redirect(target)                             # relative paths only — or an allow-list
```

## Insecure deserialization — CWE-502

Never deserialize untrusted bytes into live objects.

```text
# Unsafe
pickle.loads(data)            yaml.load(data)            unserialize(data)
torch.load(untrusted_model)   # pickle inside — loading weights is code execution
# Safe
json.loads(data)              yaml.safe_load(data)       # then validate the shape
safetensors.load(model)       # weights without code execution
```

## XML external entities — CWE-611

XML parsers resolve external entities by default in many stacks — file disclosure and SSRF through a document.

```text
# Unsafe
etree.parse(user_xml)                        # entities on → reads local files
# Safe
defusedxml.parse(user_xml)                   # or explicitly disable DTDs and
parser.setFeature(external_entities, False)  # external entity resolution
```

Prefer JSON for untrusted data; if XML is required, disable DTD processing entirely.

## Code injection / eval — CWE-94

No `eval`, `exec`, `Function`, or dynamic `import` on input.

```text
# Unsafe
eval(user_expr)
# Safe
# use a real parser / a sandboxed expression evaluator with an allow-listed grammar
```

## Server-side template injection

Never build a template string from input; pass input as data to a fixed template.

```text
# Unsafe
render_template_string("Hi " + name)         # name = "{{7*7}}" → engine executes
# Safe
render_template("greeting.html", name=name)  # name is data, not template source
```

## Mass assignment — CWE-915

Binding a whole request body to a model lets the attacker set fields you never offered.

```text
# Unsafe
user.update(**request.json)                  # body included "is_admin": true
new User(req.body)                           # same — every column is writable
# Safe
user.update(name=body["name"], email=body["email"])   # explicit field allow-list
UpdateUserInput(name=..., email=...)         # or a DTO/schema that only has safe fields
```

Allow-list the writable fields per endpoint; privileged fields (`role`, `is_admin`, `owner_id`, `balance`) are set only by code paths that authorize the change.

## Regular-expression denial of service — CWE-1333

Nested or overlapping quantifiers backtrack exponentially; one crafted string pins a CPU core.

```text
# Unsafe
/^(\w+\s?)*$/.test(userInput)                # (a+)+ -style — catastrophic backtracking
# Safe
bound input length before matching; rewrite without nested quantifiers;
or use a linear-time engine (RE2, Rust regex) for untrusted input
```

AI agents generate plausible-looking regexes confidently — test any regex that meets untrusted input against a long non-matching string.

## Unbounded resource consumption — CWE-770

New in the 2025 Top 25. Every operation an outsider can trigger needs a bound.

```text
# Unsafe
data = request.body.read()                   # no size cap
zip.extractall(upload)                       # zip bomb; no entry count/size/ratio check
while not done: call_llm(...)                # agent loop with no iteration/cost cap
# Safe
enforce max body size, max file size, max archive entries and expansion ratio,
pagination caps, timeouts, and rate limits per principal
```

## Race conditions / TOCTOU — CWE-362

Check-then-act across two steps lets concurrent requests act between them.

```text
# Unsafe
if account.balance >= amount:                # two requests both pass the check
    account.balance -= amount
# Safe
UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?
# atomic compare-and-act in one statement / transaction with the right isolation
```

Flag any security or money decision split into a read and a later write — coupons, inventory, balances, one-time tokens, file create-then-chmod.

## Improper input validation — CWE-20

The boundary rule under all of the above: validate untrusted input against an **allow-list** of shape/type/range/enum at the trust boundary, and reject what doesn't match. Deny-lists of "bad" strings are bypassable and are not validation.
