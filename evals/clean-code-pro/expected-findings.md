# Expected findings — clean-code-pro / fixture_orders.py

| ID | Location | Violation | Failure mode | Severity | Must-find |
|---|---|---|---|---|---|
| C1 | `process_data` except | Catch-all swallows failure, returns `None` | #1 | Critical | yes |
| C12 | `get_user_balance` | Hardcoded `1000` as fake success | #12 | Critical | yes |
| C7 | `process_data` | Generic names `process_data`, `data`, `item`, `temp`, `result` | #7 | Important | yes |
| C2 | `total` | Defensive guards for cases the contract excludes | #2 | Important | yes |
| C3 | `PaymentProcessorFactory` | Factory for a single implementation | #3 | Important | yes |
| C14 | `process_data` params | Speculative `format`/`legacy_mode`/`debug` with no caller | #14 | Important | yes |
| C4 | `process_data` | Comment restates the code | #4 | Nit | yes |

Quality signals: C1 and C12 at Critical. No flagging of `charge` (it is clean — one level of abstraction, intent-revealing). Over-flagging the fixture banner is a false positive.
