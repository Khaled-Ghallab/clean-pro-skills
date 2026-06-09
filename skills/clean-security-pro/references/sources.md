# Sources

Central bibliography for `clean-security-pro`. Other reference files use source
names instead of inline URLs so rule guidance stays readable.

## Contents

- Standards and catalogs
- AI code-security research and field reports
- Tools and advisory databases

## Standards And Catalogs

- **OWASP Top 10:2021**: https://owasp.org/Top10/
- **CWE Top 25 Most Dangerous Software Weaknesses**: https://cwe.mitre.org/top25/
- **OWASP Application Security Verification Standard (ASVS)**: https://owasp.org/www-project-application-security-verification-standard/
- **OWASP Cheat Sheet Series (SQLi, XSS, Secrets, Crypto, SSRF, Deserialization)**: https://cheatsheetseries.owasp.org/
- **OWASP Top 10 for LLM Applications**: https://genai.owasp.org/llm-top-10/

## AI Code-Security Research And Field Reports

- **Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions, Pearce et al., IEEE S&P 2022** (~40% of generated programs vulnerable): https://arxiv.org/abs/2108.09293
- **Do Users Write More Insecure Code with AI Assistants?, Perry et al., ACM CCS 2023** (less secure code, higher confidence): https://arxiv.org/abs/2211.03622
- **We Have a Package for You! Package Hallucinations, Spracklen et al., USENIX Security 2025** (~19.7% hallucination rate; 43% recurrence): https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen
- **Importing Phantoms: Measuring LLM Package Hallucination Vulnerabilities**: https://arxiv.org/abs/2501.19012
- **Slopsquatting, term coined by Seth Larson (2025)**: https://socket.dev/blog/slopsquatting-how-ai-hallucinations-are-fueling-a-new-class-of-supply-chain-attacks
- **AI Package Hallucination (huggingface-cli PoC), Bar Lanyado / Lasso Security**: https://www.lasso.security/blog/ai-package-hallucinations

## Tools And Advisory Databases

- **CWE-798 hard-coded credentials**: https://cwe.mitre.org/data/definitions/798.html
- **CWE-89 SQL injection**: https://cwe.mitre.org/data/definitions/89.html
- **CWE-918 SSRF**: https://cwe.mitre.org/data/definitions/918.html
- **CWE-502 deserialization**: https://cwe.mitre.org/data/definitions/502.html
- **OSV — open-source vulnerability database**: https://osv.dev/
- **National Vulnerability Database (NVD)**: https://nvd.nist.gov/
- **Semgrep / CodeQL (SAST), gitleaks / trufflehog (secret scanning)**: https://semgrep.dev/ · https://codeql.github.com/ · https://github.com/gitleaks/gitleaks
