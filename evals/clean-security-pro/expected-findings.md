# Expected findings — clean-security-pro / fixture_api.py

| ID | Location | Violation | Imperative | Class | Must-find |
|---|---|---|---|---|---|
| F1 | `get_invoice` | SQL built by string concatenation | 2 | CWE-89 / A05:2025 | yes |
| F2 | `get_invoice` | No ownership check — IDOR | 7 | CWE-639 / A01:2025 | yes |
| F3 | module top | Hardcoded secret literal | 11 | CWE-798 | yes |
| F4 | `make_reset_token` | Non-crypto PRNG for security token | 13 | CWE-338 | yes |
| F5 | `check_token` | `==` comparison of secret material | 14 | CWE-208 | yes |
| F6 | `update_profile` | Mass assignment of full request body | 6 | CWE-915 | yes |
| F7 | `after_login` | Open redirect from `next` param | 5 | CWE-601 | yes |
| F8 | `fetch_partner_feed` | TLS verification disabled; URL from caller also SSRF-suspect | 15, 5 | A04:2025 / CWE-918 | yes |
| F9 | `load_user_settings` | `yaml.load` on untrusted bytes | 4 | CWE-502 | yes |
| F10 | `is_admin` | Exception in authz check returns allow — fail open | 10 | A10:2025 | yes |

Quality signals: F1/F2/F3/F9/F10 reported at Critical; F4/F5/F8 at High or above. No findings invented beyond these (e.g., flagging the fixture banner comment).
