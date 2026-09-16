# Product Hunt listing

**Status:** Submitted 16 September 2026. Product Hunt confirmed scheduling for
17 September 2026 at 00:01 PDT (07:01 UTC / 09:01 CEST). Not yet a live launch.

**Listing:** https://www.producthunt.com/products/xero-supplier-statement-checker?launch=xero-supplier-statement-checker

**Dashboard:** https://www.producthunt.com/products/xero-supplier-statement-checker/xero-supplier-statement-checker/prelaunch

**Name:** Xero Supplier Statement Checker

**Tagline:** Check supplier statements against Xero, with evidence

**Website:** https://bjorvand.ai/en/workflows/xero-supplier-statement-checker?utm_source=producthunt&utm_medium=directory&utm_campaign=xero_statement_checker

**Description:** Free, open-source n8n workflow for checking supplier CSV/PDF statements against Xero bills. Review extracted rows, then download evidence-backed exception reports. Read-only access. Preview; live Xero and Cloud verification pending.

**Pricing:** Free source and workflow; optional paid implementation and provider
usage costs explained on the website. Do not select a paid product or trial.

**Selected launch tags:** Accounting, Open Source, Productivity. Workflow was not
available in the platform's launch-tag search.

**Saved media:** 240×240 product icon and three gallery images: the English
website's social image, repository cover and synthetic report preview. The
report image labels the data as synthetic. No video; YouTube remains deferred.

**Verified in the saved preview:** scheduled date, name and tagline, description
including pending live acceptance, free pricing, three gallery images, maker
attribution and pinned first comment. The website CTA retains the campaign
parameters; the separate GitHub link points to the public source. The public
maker profile also has a project introduction and tracked Bjorvand.ai link.
No ads, investor submission or additional review/shoutout was purchased or sent.

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
