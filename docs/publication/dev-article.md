---
title: "Checking Xero supplier statements with n8n and deterministic TypeScript"
published: true
description: "Build an operator-reviewed supplier statement checker with exact amounts, source evidence and fail-closed Xero pagination."
tags: typescript, automation, opensource, tutorial
---

Published: https://dev.to/kevinbjorv/checking-xero-supplier-statements-with-n8n-and-deterministic-typescript-29h

![Xero Supplier Statement Checker: read-only n8n workflow by Bjorvand AI](https://raw.githubusercontent.com/KevinBjorv/xero-supplier-statement-checker/main/docs/assets/repository-cover.jpg)

A reference match is not the same thing as a safe amount comparison. A supplier
statement might show the invoice's original total, the remaining balance after a
payment, or an unclear amount column. Treating all three as the same value can
produce a convincing report with the wrong conclusion.

The open-source **Xero Supplier Statement Checker** uses n8n for orchestration
and TypeScript for deterministic checking. This article explains three choices
behind it: explicit amount meanings, complete retrieval and evidence-preserving
operator review.

The project is a preview. Synthetic tests and local n8n runs have passed; live
Xero and n8n Cloud verification are still pending. All examples here are fictional.

## 1. Separate references from amounts

The operator selects a supplier from the configured Xero organization's contacts.
The checker only considers bills within that supplier and currency. It normalizes
references using Unicode NFC, outer-whitespace trimming and ASCII case changes.
It preserves punctuation, internal spaces and leading zeros.

It does not use amounts, dates or fuzzy similarity to establish a match. Xero's
purchase-bill `InvoiceNumber` is the primary reference; the separate `Reference`
field is supporting evidence. Multiple candidates stay visible for review.

Only after one eligible reference candidate exists can the checker compare
tax-inclusive original totals. The checked-in fixture includes these two cases:

| Reference | Statement | Xero | Result |
| --- | --- | --- | --- |
| INV-101 | Original 250.00 GBP | Original 245.00 GBP | Amount difference: 5.00 GBP |
| INV-107 | Outstanding 45.00 GBP, no original total | Reference candidate found | Review required; no automatic comparison |

Public contracts keep monetary values as decimal strings. Calculations use
integer minor units, based on a checked-in currency table. Excess non-zero
fractional digits are flagged instead of silently rounded. Xero JSON is parsed
losslessly before converting its numeric values.

Credits, partial payments, duplicate statement references and unsafe bill
statuses also require review. A fully paid bill can still match its original
total; the report displays its current paid status separately.

## 2. A later failed page invalidates the retrieval

"Not found" is a statement about the searched data. If page one succeeds and
page two fails, there is no sound basis for declaring an invoice absent.

The workflow uses HTTP Request nodes outside the Code nodes, sequential pages
and explicit page sizes. It records requested pages, returned IDs, counts and
the retrieval interval. The checking interface validates that evidence rather
than trusting a caller's `success: true` flag.

Repeated pages, duplicate IDs, inconsistent counts, missing pages, malformed
responses or exhausted retries stop the check. Rate limits use the provider's
`Retry-After` delay within a bounded retry policy. There is no date lookback or
outstanding-balance filter that quietly omits old or paid bills.

The interrupted-retrieval fixture fails on page two with a 401. Its report has
zero matches, zero amount differences and zero not-found conclusions. Available
statement rows remain review-required, and no follow-up draft is produced.

## 3. Let AI extract; keep the operator and rules in control

CSV uses no AI. The operator maps columns and explicitly identifies original
totals and outstanding balances. Invoice references stay strings, including
leading zeros, and quoted multiline fields retain their source record numbers.

For optional text-PDF extraction, n8n extracts pages separately. The code assigns
page numbers and verifies page coverage. OpenAI receives page-labelled text with
a strict output schema, no tools and `store: false`. Returned evidence excerpts
must exist in the supplied page text. Xero bill data is not included in that request.

The review form shows extracted rows, source references and warnings. Operators
can correct a canonical CSV representation and must confirm supplier, currency,
amount meanings and statement coverage. Initial extraction and corrections stay
in the evidence. The AI never chooses a supplier or decides a match.

This does not eliminate extraction risk. Scanned, encrypted or partly unreadable
PDFs are rejected, and the operator must check the original document for omitted
rows. Provider retention is separate from the `store: false` setting.

## Try the synthetic example

With Node.js 24 or later:

```sh
git clone https://github.com/KevinBjorv/xero-supplier-statement-checker.git
cd xero-supplier-statement-checker
npm ci
npm run demo
npm run check
```

Open `output/demo/report.html`. The ten-line fixture produces two matched rows,
one amount difference, one not found and six requiring review. No credentials are
needed. The repository also includes an importable n8n synthetic form workflow.

The downloadable ZIP contains HTML, CSV and JSON, plus an optional unsent draft.
HTML is escaped; CSV formula-like values are protected; exact originals remain
in JSON. Limits stop processing at 10 MiB, 50 PDF pages or 1,000 rows rather than
truncating data.

The checker supports statement review. It does not reconcile supplier balances,
convert currencies, post accounting entries or send email. A current Xero fetch
is not a historical or atomic snapshot at the statement date.

## Source and implementation

[MIT source, fixtures, tests and verification status](https://github.com/KevinBjorv/xero-supplier-statement-checker)

[See the sample report and implementation options at Bjorvand AI](https://bjorvand.ai/en/workflows/xero-supplier-statement-checker?utm_source=devto&utm_medium=article&utm_campaign=xero_statement_checker)

Disclosure: this is a Bjorvand AI project. The workflow is free; installation and
customization are separate paid services. This article was prepared with AI
assistance and checked against the source and synthetic fixture results.
