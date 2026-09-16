# Install the Xero Supplier Statement Checker

[Back to the project overview](../README.md) · [Verification status](verification.md)

## Install in n8n

The tested local runtime is **n8n 2.39.6**. Use this version or newer; the template
uses authenticated Form Trigger 2.6. Import the synthetic demo first and run it
to confirm your installation supports all required nodes. Cloud verification is
a separate release gate, not implied by a successful local run.

1. Import the live workflow JSON. It is inactive and contains no credentials.
2. Set your Xero tenant ID in **Operator configuration**. Keep one tenant per
   workflow. Obtain the ID with an authenticated `GET https://api.xero.com/connections`
   using the OAuth credential below; select the intended organization by name.
3. Create a **generic OAuth2 API** credential, not n8n's built-in Xero credential:

   | Setting | Value |
   | --- | --- |
   | Grant | Authorization Code |
   | Authorization URL | `https://login.xero.com/identity/connect/authorize` |
   | Token URL | `https://identity.xero.com/connect/token` |
   | Scope | `offline_access accounting.contacts.read accounting.invoices.read` |
   | Client authentication | Header |
   | Client ID / secret | Your own Xero application's credentials |

4. Register the exact callback URL displayed by n8n in your Xero Web app. For
   local n8n this is normally `http://localhost:5678/rest/oauth2-credential/callback`;
   Cloud and hosted instances use their own HTTPS callback. Complete OAuth for
   the intended test organization first. If an older connection granted write
   scopes, revoke it and authorize a fresh read-only connection.
5. Assign that credential to **Fetch Xero Contacts** and **Fetch Xero Invoices**.
6. For optional PDFs, set `aiEnabled` to `true` and enable the initially disabled
   **Extract PDF fields with OpenAI** node; assign an HTTP Header Auth
   credential to **Extract PDF fields with OpenAI**, with name `Authorization`
   and value `Bearer YOUR_OPENAI_API_KEY`. Set the model in Operator configuration
   if necessary; the default is `gpt-5.6-terra`. Do not put secrets into nodes.
7. Review [security and retention](security.md), publish the workflow, and
   open its production form URL while signed in to n8n. The form requires workflow
   execution access. Follow n8n's own authorization prompt if shown.
8. Upload a statement, select and confirm a contact, map CSV columns or review
   PDF extraction, and confirm every transaction line. Submit the result summary
   to download the report ZIP.

No separate backend, account database or Bjorvand service is required. An
installation needs n8n's normal database and binary storage. Self-hosted Code
nodes require the built-in `crypto` module for SHA-256; allow only `crypto` in the
task runner with `NODE_FUNCTION_ALLOW_BUILTIN=crypto`. No external Code-node
module imports are required. Cloud already supplies `crypto`.

## Supported inputs and review

- UTF-8 CSV (BOM permitted), with comma, semicolon or tab delimiter. Select the
  number and date formats explicitly. Quoted multiline fields are supported.
- Text-based PDF with readable text on every page. Scanned, encrypted or partly
  unreadable documents are rejected. No OCR is performed.
- Maximum 10 MiB, 50 PDF pages and 1,000 statement rows. Limits stop processing;
  data is never silently truncated.
- One supplier and currency per run. Currency codes with defined minor units
  from the checked-in ISO 4217 table are supported; no currency conversion.

Map original tax-inclusive invoice totals separately from outstanding balances.
A generic `Amount` heading has no assumed meaning. Missing original totals,
ambiguous extraction, partial payments, credits, duplicates and cancellations
require review even when a reference candidate is visible.

The review screen exposes canonical CSV for corrections. Keep existing source
IDs/pages/rows. Do not delete rows: use kind `other` for unsupported rows. Added
PDF rows need a source page. Original values and confirmed values are preserved
in the report audit evidence. Review sessions expire after 24 hours.

## Outputs and interpretation

- `report.html`: standalone, printable report with every statement row.
- `report.csv`: spreadsheet-safe output; formula-like text is prefixed with an
  apostrophe. Exact originals remain in JSON.
- `report.json`: schema version, run context, file hash, source values, review
  changes, retrieval manifest, candidates and comparisons.
- `follow-up-draft.txt`: optional unsent, deterministic wording. No mail service
  is connected. Failed runs never generate a follow-up draft.

Matched means one eligible bill and equal comparable original totals. An amount
difference does not establish its cause. Not found means a reliable reference
had no eligible match in a complete retrieval, not that documents or debt exist.
The statement date and Xero retrieval interval are both recorded. Current data
is not an atomic or historical snapshot.


## Costs and external processing

Operators cover their n8n plan/hosting, applicable Xero app tier, and OpenAI
usage for PDFs. CSV and synthetic mode make no OpenAI requests. Model usage is
recorded in the live extraction test evidence; pricing may change. Check provider
pricing before deployment instead of relying on a fixed cost estimate.

PDF text is sent to OpenAI only when enabled. Xero bill data is processed by code
inside n8n. `store: false` disables Responses application storage but is not a
promise of zero provider retention. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

MIT license. Setup and customization are available through Bjorvand AI; paid
implementation is separate from the free source and workflow template.
