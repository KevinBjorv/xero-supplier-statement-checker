# Architecture and invariants

The public contracts are in `src/types.ts`, schema version `1.0`. All JSON monetary
values are decimal strings; `BigInt` minor units stay inside calculations. ISO
currency data is checked in with source URL and publication date. No non-zero
fraction beyond the currency's minor unit is rounded. Tolerance is zero.

The pipeline separates CSV/PDF extraction, source validation, operator review,
Xero retrieval, manifest validation, deterministic matching and reporting.
`checkStatement(context, lines, retrieval, review?)` is pure. It validates page
evidence independently; there is no trusted `complete: true` switch.

Reference normalization is NFC, outer trim and ASCII uppercasing. Punctuation,
internal spaces and zeroes remain. Duplicate normalized statement references
require review on every affected row. Multiple eligible Xero bills remain
ambiguous. The separate Xero `Reference` field is a review-only fallback;
`InvoiceNumber` is primary for ACCPAY.

Xero requests include all invoice statuses and no date, outstanding or
created-by-app filter. Raw JSON is parsed losslessly. Page metadata must agree,
IDs must be unique, and the collected count must match. Without metadata, an
explicit final empty page is required. Mid-fetch updates, errors and unknown
responses fail closed. Pagination cannot manufacture an atomic snapshot;
the report always states the actual retrieval interval.

Original statement totals are compared with Xero `Total` only. Paid bills remain
eligible. Partial payment or credit context, unsupported bill status and missing
comparable values override normal matching and require review. No code makes a
finding about debt, missing documents, or the cause of an exception.

PDF extraction uses strict JSON schema and one request per numbered page. Page
numbers come from n8n, not the model. Evidence quotes must occur on that page.
AI failures and fabricated quotations abort extraction. Matching begins only
after an operator confirms the coverage and values. Confirmation does not make
unsupported line types or missing original totals eligible for a match.

Bundling uses the CSV parser's native-Buffer sync entry, without ESM namespace
exports in the runtime wrapper. n8n disables prototype changes and property
definition in Code nodes; its protections remain enabled. Requests use HTTP
Request nodes, not Code-node networking. Per-run state travels with items,
never workflow-global static data.

The live graph's failure route creates diagnostic artifacts with no matching
conclusions. After download, a terminal gate also marks the n8n execution failed
when the check did not complete. Monitor both the report's `status` and n8n
execution state, not merely whether an intermediate node produced an output.
