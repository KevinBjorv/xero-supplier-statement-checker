# Verification record

This file distinguishes implemented behavior from provider/deployment proof.
The current implementation is **not yet release-ready** until pending gates
below are evidenced for the release commit.

| Gate | Status / evidence |
| --- | --- |
| TypeScript and deterministic tests | 40 passing tests; generated workflow parity passed |
| Golden report | 10 source rows; counts 2 / 1 / 1 / 6; JSON/CSV/HTML/draft bytes reproduced |
| Bundled code parity | Generated report Code node matches TypeScript output |
| Native n8n fixture | n8n 2.39.6 imported and executed successfully; ZIP created |
| Complete CSV graph | Passed with 101 synthetic contacts and 101 synthetic bills across two pages each |
| Interrupted Xero graph | Passed with a page-two 401; failed report, 0 matches, 0 amount differences, 0 not-found conclusions |
| OpenAI extraction | Passed for 6 rows over 2 synthetic PDF pages using exact n8n-extracted text; an earlier unsupported quotation was rejected |
| Native PDF graph | Passed with actual PDF extraction and source-verified synthetic AI responses; 6 rows, counts 2 / 1 / 1 / 2 |
| Browser forms and downloads | Authenticated demo submitted in browser; ZIP downloaded and all four files verified byte-for-byte against golden artifacts |
| Xero test organization | Pending dedicated application, OAuth and live run |
| n8n Cloud fresh import/run | Pending access to a Cloud workspace |
| Bilingual site | Typecheck and production build passed; both languages checked at 390/768/1440/1920 without overflow; English booking questions and workflow context verified without submission |
| Public release / directory submission | Pending release checks and submission |
| Permissioned real workflows / paid implementation | Not yet performed |
| English YouTube demo | Deferred by user |

Local diagnostic evidence is under ignored `output/verification` and `.runtime`.
Never publish customer credentials, raw live-provider data or local account
details with an evidence report. Record a tested commit and sanitized live-run
summary before changing a pending gate to passed.
