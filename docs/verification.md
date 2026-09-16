# Verification record

This file distinguishes implemented behavior from provider/deployment proof.
The current implementation is **not yet release-ready** until pending gates
below are evidenced for the release commit.

| Gate | Status / evidence |
| --- | --- |
| TypeScript and deterministic tests | 42 passing tests; generated workflow parity passed; review-only rows cannot produce automatic amount comparisons |
| Golden report | 10 source rows; counts 2 / 1 / 1 / 6; JSON/CSV/HTML/draft bytes reproduced |
| Bundled code parity | Generated report Code node matches TypeScript output |
| Native n8n fixture | n8n 2.39.6 imported and executed successfully; ZIP created |
| Complete CSV graph | Passed with 101 synthetic contacts and 101 synthetic bills across two pages each |
| Interrupted Xero graph | Passed with a page-two 401; n8n execution and report both failed, diagnostic ZIP retained, 0 matches, 0 amount differences, 0 not-found conclusions |
| OpenAI extraction | Passed for 6 rows over 2 synthetic PDF pages using exact n8n-extracted text; an earlier unsupported quotation was rejected |
| Native PDF graph | Passed with actual PDF extraction and source-verified synthetic AI responses; 6 rows, counts 2 / 1 / 1 / 2 |
| Browser forms and downloads | Authenticated demo ZIP verified byte-for-byte; live workflow with synthetic API responses completed actual file upload, supplier selection, column mapping, row confirmation, summary and ZIP download (10 rows, counts 2 / 1 / 1 / 6) |
| Review-screen accessibility | Final form checked at 390/768/1440/1920 pixels with no page overflow; table receives keyboard focus and scrolls horizontally with arrow keys |
| Xero test organization | Pending dedicated application, OAuth and live run |
| n8n Cloud fresh import/run | Pending access to a Cloud workspace |
| Bilingual site | Published at bjorvand.ai from site commit b721c74; production build, TypeScript, lint and 856 site/SEO/localization assertions passed; both languages checked at 390/768/1440/1920; localized social images, canonical URLs, FAQs and pinned workflow download verified |
| Public source / release / directory submission | Source published on GitHub; v0.1.0 release assets staged as a draft; final release and directory submission remain pending |
| Permissioned real workflows / paid implementation | Not yet performed |
| English YouTube demo | Deferred by user |

Local diagnostic evidence is under ignored `output/verification` and `.runtime`.
Never publish customer credentials, raw live-provider data or local account
details with an evidence report. Record a tested commit and sanitized live-run
summary before changing a pending gate to passed.

## Reproduction checkpoints — 16 September 2026

- Initial commit `8fcb9de273ac7fc945fca365d1dc86219a4f6d17` passed a fresh
  credential-free Windows checkout (`npm ci`, `npm run check`, `npm run demo`)
  and [GitHub Actions](https://github.com/KevinBjorv/xero-supplier-statement-checker/actions/runs/35081345874).
- Subsequent corrections enlarged the review form, kept its table scrollable,
  and suppressed calculated comparisons on rows requiring review. The full
  42-test suite and native CSV/PDF/interrupted-retrieval scenarios passed again.
- All provider data in these completed checks was synthetic. Actual OpenAI
  extraction was evaluated against six manually verified rows from two text-PDF
  pages. Xero HTTP responses were fixtures; this is not live Xero proof.
- No customer pilots, commercial sale, n8n directory acceptance or site
  deployment is inferred from these checks. The release draft identifies the
  target commit; its CI run must pass before publication.
