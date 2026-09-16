# Product Hunt listing

**Name:** Xero Supplier Statement Checker

**Tagline:** Check supplier statements against Xero, with evidence

**Website:** https://bjorvand.ai/en/workflows/xero-supplier-statement-checker?utm_source=producthunt&utm_medium=directory&utm_campaign=xero_statement_checker

**Description:** Free, open-source n8n workflow for checking supplier CSV/PDF statements against Xero bills. Review extracted rows, then download evidence-backed exception reports. Read-only access. Preview; live Xero and Cloud verification pending.

**Pricing:** Free source and workflow; optional paid implementation and provider
usage costs explained on the website. Do not select a paid product or trial.

**Relevant categories:** Accounting, Workflow Automation, Open Source — select
the closest available platform labels rather than inventing categories.

**Gallery:** repository cover and synthetic report preview, with captions that
identify fictional data. No video placeholder; YouTube is deferred.

## First maker comment

Supplier statements can mix original invoice totals, remaining balances and
credits. We built this workflow around that distinction: an outstanding balance
must never be compared with an original invoice total.

An operator uploads a statement, selects the supplier, reviews every extracted
row and then runs deterministic reference and total checks against Xero bills.
CSV uses no AI. Optional PDF extraction is reviewed before matching. The workflow
has read-only Xero access and no email-send step.

The demo has 10 fictional rows: 2 matched, 1 amount difference, 1 not found and 6
for review. Incomplete retrieval produces a failed diagnostic report instead of
false absence findings.

This is a preview with synthetic and self-hosted tests completed. Live Xero and
n8n Cloud acceptance remain pending. Try the credential-free example first.

I'm sharing this through Bjorvand AI. The source is MIT licensed and free;
implementation services are optional. The website has the sample report,
download and installation details. Feedback on statement formats and the review
step is particularly useful.
