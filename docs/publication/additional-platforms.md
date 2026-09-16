# Additional platform submission pack

Prepared 16 September 2026 for the owner's requested second distribution batch.
Prepared copy is not evidence that a platform accepted or published a listing.
Use the per-platform status in [the distribution record](README.md).

## Shared listing facts

Name: Xero Supplier Statement Checker

Short description: Read-only n8n workflow to check supplier statements against
Xero bills and export evidence-backed exceptions.

Product website: https://bjorvand.ai/en/workflows/xero-supplier-statement-checker

Source: https://github.com/KevinBjorv/xero-supplier-statement-checker

License: MIT for this project's source and workflows. n8n and connected services
have their own terms and costs. The project is not affiliated with Xero or n8n.

Pricing: Free source and workflow. n8n hosting, Xero and optional OpenAI usage may
cost money. Bjorvand AI implementation and customization services are optional.

Contact for public-facing fields: kevin@bjorvand.ai

Platforms: n8n, self-hosted; designed for n8n Cloud, with fresh Cloud acceptance
still pending. Do not describe the workflow as a standalone hosted application.

Suggested categories, where available: Accounting, Accounts Payable, Workflow
Automation, Open Source, Developer Tools. Choose actual platform labels.

Images: use the existing repository cover and synthetic report preview in
`assets/`. Keep the synthetic-data label visible. Do not add fake reviews,
customer logos, time-saved figures or certification claims.

## Directory description

Xero Supplier Statement Checker is a free, MIT-licensed n8n workflow for checking
supplier CSV and text-PDF statements against Xero purchase bills.

An operator uploads one statement, selects the supplier, reviews and corrects
extracted rows, and confirms the input before bill retrieval and deterministic
checking. CSV requires no AI. Optional PDF extraction uses OpenAI; Xero bill data
is not sent in that extraction request.

Reference matching is restricted to the selected supplier and currency. Exact
decimal-safe comparisons use comparable original invoice totals. Outstanding
balances, partial payments, credits, duplicate references and ambiguous cases
remain visible for review. Incomplete retrieval produces a failed diagnostic
report instead of unsupported matched or not-found conclusions.

Downloadable reports include HTML, CSV and JSON, plus an optional unsent draft.
The workflow has read-only Xero access and no accounting-write or email-send
operation. A credential-free synthetic demo, source, tests, fixtures and example
reports are included.

This is a preview. Synthetic and self-hosted checks have been exercised; live
Xero and clean n8n Cloud acceptance remain pending. It does not reconcile account
balances, convert currencies or process scanned PDFs.

## SaaSHub

Login: https://www.saashub.com/login

Submission route observed in the UI: https://www.saashub.com/services/submit

Use the directory description and workflow/report screenshots. Use the product
page as the primary website, with `utm_source=saashub`, `utm_medium=directory`
and `utm_campaign=xero_statement_checker` where accepted. Verify product
ownership through the actual flow. Paid promotion is outside the current scope.

## SourceForge

Login: https://sourceforge.net/auth/

Create route: https://sourceforge.net/p/add_project

Create a project for the checker source and workflows, with GitHub as the primary
development repository. Do not upload n8n itself or claim its license is MIT.
Use the directory description, screenshots, installation documentation and a
versioned, sanitized package. Mark previews as previews; the stable GitHub
release is still a draft. The website may use `utm_source=sourceforge` and
`utm_medium=directory` with the shared campaign.

## AlternativeTo

Login: https://alternativeto.net/login

Submit through Suggest new application after verifying the account email. Use
the clean product URL without UTM parameters. Their FAQ prohibits website URLs
inside descriptions and promotion through personal profiles.

Describe the installable checker as an n8n-dependent software project, with
public source and a usable synthetic demo. Do not call it an alternative to
Xero, n8n or an entire accounts-payable platform. Only suggest competitor
relationships after verifying equivalent statement-checking scope. Admission
and queue time are controlled by AlternativeTo; priority review is optional
and is not authorized for purchase.

## Hashnode

Login: https://hashnode.com/login

Republish the technical [DEV article](dev-article.md), retaining the AI-assistance
disclosure, source links and preview limitations. Set its original/canonical URL
to the published DEV article, because that is the original version of this text:

https://dev.to/kevinbjorv/checking-xero-supplier-statements-with-n8n-and-deterministic-typescript-29h

Use the repository cover and report example. Change the product-page CTA's
source to `hashnode` and medium to `article`. Do not canonicalize the tutorial
to a different landing page. If the platform requires creating a publication,
use the owner's Bjorvand AI identity and existing publication if present.

## AccountingWEB

Login: https://www.accountingweb.co.uk/user/login?destination=home

The commercial route is a Sift/AccountingWEB partner or sponsored-content
placement, not unrestricted software-directory submission. Inspect existing
account permissions first. Do not buy a placement, agree to a contract or send
a partnership email without separate authorization. Ordinary community blogs
restrict self-promotion.

Prepared editorial angle: **Why matching a supplier invoice number is not enough**.

Begin with the fictional 250.00 GBP original-total versus 245.00 GBP bill example,
then contrast an outstanding-only 45.00 GBP row. Explain original totals, paid
status, credits and incomplete retrieval. Show the sample exception report and
how the operator checks evidence. Disclose Bjorvand AI ownership and distinguish
synthetic examples from customer results. A commercial CTA belongs only in a
placement where the publisher permits it. Live acceptance and customer case
studies must not be invented to satisfy editorial requirements.

## Indie Hackers

Login: https://www.indiehackers.com/sign-in

Product database: https://www.indiehackers.com/products

Product-update title: **Building a supplier statement checker that refuses unsafe comparisons**

Draft update:

I am sharing an open-source n8n workflow for checking supplier statements
against Xero bills. A supplier's Amount column may mean the original invoice
total or the remaining balance. The workflow makes that distinction explicit
before it compares anything.

The operator selects the supplier, reviews extracted rows and confirms the input.
Matching uses references and deterministic rules. Ambiguous rows stay visible;
a failed retrieval cannot produce a not-found conclusion.

The credential-free demo contains ten fictional rows: two matched, one amount
difference, one not found and six requiring review. Synthetic and self-hosted
checks have run. Live Xero and n8n Cloud acceptance are still pending.

The source and workflow are free under MIT. Bjorvand AI offers optional
implementation help. There are no customer savings or revenue claims to report.
The sample report, download and implementation details are on the product page.

Use `utm_source=indiehackers`, `utm_medium=community` and the shared campaign.
Leave unverifiable revenue, customer and funding fields unset; never fabricate
traction to fill a product profile.

## Peerlist

Login: https://peerlist.io/login

Create a project on the owner's individual profile with the shared description,
source link, website, icon and three existing gallery images. Use
`utm_source=peerlist`, `utm_medium=directory` and the shared campaign.

The published help requires a verified individual profile and a complete project
before a Monday Launchpad launch. A profile project and a Launchpad submission
are separate milestones. Use the earliest available ordinary launch; do not
claim a scheduled launch until the UI confirms it.

## OpenAlternative

Login/submission: https://openalternative.co/auth/login?next=/submit

Use the directory description, public GitHub repository, MIT license and
synthetic report screenshot. Use `utm_source=openalternative` and
`utm_medium=directory` with the shared campaign where permitted.

This is a conditional fit for an alternatives directory. If the submission
requires a proprietary alternative, verify a genuinely comparable supplier
statement-checking product first. Do not list Xero itself or claim broad
accounts-payable feature parity. Curator acceptance remains external.

## Reddit: r/n8n

Published post:
https://www.reddit.com/r/n8n/comments/1wi42z4/supplier_statement_checker_n8n_forms/

Posted as u/Equivalent_Safe4801 on 16 September 2026. Verified the title, body,
GitHub link, Workflow - Github Included flair, Brand Affiliate disclosure and
synthetic 2/1/1/6 result counts on the resulting post page.

The post contains the original-total versus outstanding-balance example,
credential-free demo instructions, read-only safeguards, AI-development
disclosure and pending live acceptance. It does not contain a commercial CTA
or tracked website link, in accordance with the community's technical-sharing
rules. Do not repost it to obtain additional exposure. Posting does not imply
moderator endorsement or any measured acquisition result.

## Hacker News: Show HN

Login/submission: https://news.ycombinator.com/submit

Title: **Show HN: A read-only supplier statement checker for Xero, built with n8n**

Submission URL: https://github.com/KevinBjorv/xero-supplier-statement-checker

The repository is the primary link so visitors can try the credential-free demo
without signing up. Do not submit a marketing landing page as the Show HN.

Prepared first comment:

I built this around two failure cases: comparing an outstanding balance with an
original invoice total, and reporting an invoice missing after only part of the
Xero data was retrieved.

n8n handles forms and HTTP requests. Bundled TypeScript validates the extraction,
retrieval manifest, references and exact amounts. An operator reviews the input
before matching; ambiguous candidates stay visible. AI is optional for text-PDF
extraction and does not decide matches. It has no accounting-write or email-send
operation.

To try it: use Node 24+, clone the repository, run npm ci and npm run demo, then
open output/demo/report.html. Alternatively import workflows/synthetic-demo.json
into n8n. Both use fictional data and need no provider credentials. The ten-row
fixture produces 2 matched, 1 amount difference, 1 not found and 6 review items.

It is a preview: synthetic and self-hosted checks have run, while live Xero and
clean n8n Cloud acceptance remain pending. AI assisted the implementation and
documentation. I maintain it through Bjorvand AI; the code is MIT licensed.

I would welcome feedback on the operator-review boundary and the evidence needed
before a checker should be allowed to say an invoice was not found.
