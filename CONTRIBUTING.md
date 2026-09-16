# Contributing

Focused bug reports, documentation improvements and deterministic matching fixes
are welcome. Read the [project overview](README.md), [architecture](docs/architecture.md)
and [verification record](docs/verification.md) first.

## Report a problem

Use the repository's bug-report form. Include the n8n version, workflow/source
commit, expected result, actual result and a minimal **synthetic** reproduction.
Do not attach customer statements, Xero responses, tenant IDs, credentials,
execution exports or signed form URLs. The checked-in fixtures are safe examples.
For a security vulnerability, use the private route in [SECURITY.md](SECURITY.md).

## Work locally

Use Node.js 24 or later:

```sh
npm ci
npm run check
npm run demo
```

Edit TypeScript in `src/`, then run `npm run build` to update the generated n8n
workflows. Do not edit bundled Code nodes directly. If expected fixture results
change, inspect every changed JSON/CSV/HTML/draft artifact, regenerate the report
preview with `npm run docs:assets`, and explain the changed behavior.

For meaningful behavior changes, add a synthetic regression case. Keep exact
decimal values, source provenance, duplicate rows and ambiguous candidates.
Never introduce accounting writes, email delivery, fuzzy matching or comparisons
between outstanding balances and original totals.

Optional orchestration checks use `n8n@2.39.6` installed under `.runtime/n8n`.
Run `node scripts/verify-n8n.mjs csv`, `pdf` and `api-failure` sequentially. These
replace external APIs with synthetic responses. They do not prove live Xero.

Optional provider extraction: set your key locally in ignored `.env.local`, then
run `npm run test:openai`. Only synthetic text is sent; provider charges apply.

## Send a pull request

Describe the concrete problem, resulting behavior, checks run and remaining
limitations. Keep unrelated changes separate. Include generated workflow changes
when source changes affect them. Never commit `.env.local`, execution data,
provider secrets or real customer fixtures.

Source and included project artwork are MIT licensed. Preserve third-party
license notices. Publication, Cloud verification and live-provider acceptance
are separate checks; a green unit-test run does not replace them.
