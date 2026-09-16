# Check supplier CSV/PDF statements against Xero bills with human review

## Who this is for

Finance operators and accounting teams who want to check a supplier statement
against Xero purchase bills and keep the evidence behind each exception.

**Preview:** tested with synthetic fixtures and self-hosted n8n 2.39.6. Live Xero
test-organization and n8n Cloud verification remain pending. Start with synthetic
data. This is an independent Bjorvand AI project, not an endorsed Xero integration.

## What this workflow does

Upload a UTF-8 CSV or text PDF, choose one supplier from Xero contacts, and confirm
every extracted transaction row. The workflow retrieves that supplier's purchase
bills and checks invoice references and tax-inclusive original totals using
deterministic TypeScript. AI is optional for PDF field extraction only.

Results are matched, amount difference, not found in completely retrieved data,
or review required. Partial payments, credits, duplicate references, ambiguous
candidates and outstanding-only rows require review. Paid bills remain visible.
Incomplete retrieval stops matching and produces a failed diagnostic report.

Download HTML, CSV and JSON in a ZIP, plus an optional unsent follow-up draft.
There are no accounting-write or email-send operations.

## Setup

1. Import the credential-free synthetic workflow from the repository and verify
   the authenticated form and ZIP download on your installation.
2. Import this workflow and set one Xero tenant ID in Operator configuration.
3. Create a generic OAuth2 credential with only `offline_access`,
   `accounting.contacts.read` and `accounting.invoices.read`. Assign it to both
   Xero HTTP Request nodes. Register n8n's callback URL in your dedicated Xero app.
4. For PDFs, configure an OpenAI header credential, enable the initially disabled
   extraction HTTP node and set `aiEnabled`. CSV requires no OpenAI key.
5. Review storage and retention settings, publish the workflow, then use its form
   while signed in to n8n. Self-hosted Code nodes need the built-in `crypto` module
   allowed for file hashing; no external Code-node npm imports are required.
6. Upload, select the supplier, map columns, confirm the rows and download results.

## Requirements and limits

Tested local version: n8n 2.39.6. One supplier and currency per statement.
Maximum 10 MiB, 50 text-PDF pages and 1,000 rows. No OCR, currency conversion or
full supplier-balance/payment reconciliation. Original totals are never compared
with outstanding balances. Current Xero retrieval is not a historical snapshot.

The source and workflow are MIT licensed. Operators cover hosting, applicable
Xero app tier and optional OpenAI usage. PDF text goes to OpenAI when enabled;
Xero bill data stays outside the extraction request. `store: false` does not
promise zero provider retention. Credentials stay in n8n's credential store.

## Demo, installation and optional implementation

[See the sample report and setup options at Bjorvand AI](https://bjorvand.ai/en/workflows/xero-supplier-statement-checker?utm_source=n8n&utm_medium=template&utm_campaign=xero_statement_checker)

[Source, synthetic fixtures and complete installation guide](https://github.com/KevinBjorv/xero-supplier-statement-checker)

Bjorvand AI offers paid installation separately from the free workflow.
