# Injection and the CWE Top 25 Heavy Hitters

Source: CWE Top 25 Most Dangerous Software Weaknesses (cwe.mitre.org). This file gives safe/unsafe pairs for the injection-family weaknesses AI agents over-produce. Language is pseudocode; map to your stack's safe API.

## Contents

- SQL injection (CWE-89)
- OS command injection (CWE-78)
- Cross-site scripting (CWE-79)
- Path traversal (CWE-22)
- Server-side request forgery (CWE-918)
- Insecure deserialization (CWE-502)
- Code injection / eval (CWE-94)
- Server-side template injection
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

Encode for the sink; rely on the framework's auto-escaping; never inject untrusted data into a raw-HTML API.

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

## Path traversal — CWE-22

Canonicalize, then verify the result stays inside the base directory.

```text
# Unsafe
open(base + "/" + user_path)                # "../../etc/passwd"
# Safe
full = realpath(join(base, user_path))
if not full.startswith(realpath(base) + sep): reject()
open(full)
```

## Server-side request forgery — CWE-918

Validate the destination of any request built from input.

```text
# Unsafe
fetch(request.query.url)                     # attacker → http://169.254.169.254/...
# Safe
host = parse(url).host
if not allowlisted(host) or is_private_or_linklocal(resolve(host)): reject()
fetch(url, allow_redirects=False)            # and re-check after any redirect
```

Block loopback, RFC1918 private ranges, link-local (`169.254.0.0/16`, incl. cloud metadata), and IPv6 equivalents.

## Insecure deserialization — CWE-502

Never deserialize untrusted bytes into live objects.

```text
# Unsafe
pickle.loads(data)            yaml.load(data)            unserialize(data)
# Safe
json.loads(data)              yaml.safe_load(data)       # then validate the shape
```

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

## Improper input validation — CWE-20

The boundary rule under all of the above: validate untrusted input against an **allow-list** of shape/type/range/enum at the trust boundary, and reject what doesn't match. Deny-lists of "bad" strings are bypassable and are not validation.
