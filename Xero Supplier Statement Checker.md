# Xero Supplier Statement Checker

## Goal
Build a public automation that compares supplier statements with Xero bills and produces an evidence-backed exception report. Sell setup and customization to English-speaking accounting teams through Bjorvand AI.

Read-only checking, not full supplier balance reconciliation or a new SaaS.

## MVP Scope
- One Xero organization, one manually selected supplier and one currency per run.
- Input: text-based PDF or CSV supplier statement.
- Output: JSON, downloadable CSV and a readable HTML report.
- Exclude scanned documents, currency conversion, payment reconciliation, automated posting and automatic email delivery.

## Workflow
1. Accept the statement, supplier selection and statement date.
2. Extract invoice references, dates, currency, original totals and outstanding amounts where present. Preserve source page/row references.
3. Validate fields; mark unclear or unsupported lines for review.
4. Retrieve supplier bills from Xero, including paid bills. Complete pagination; avoid filters that hide older invoices.
5. Run deterministic matching and amount checks.
6. Generate the report and an optional, unsent follow-up email draft.

Record statement date and Xero retrieval time. Current Xero data is not automatically a historical snapshot.

## Matching Rules
Use code, not an LLM, for matching and calculations. AI may extract document fields and draft text from verified results.

Match within the selected supplier and currency using invoice references. Normalize conservatively and retain original values. Amount alone must never establish a match.

Each line receives one result:
- **Matched:** One unambiguous bill with an agreeing, comparable original total.
- **Amount difference:** One unambiguous bill with different comparable original totals.
- **Not found in retrieved Xero data:** A reliable reference has no match after a complete, successful fetch.
- **Review required:** Uncertain extraction, multiple candidates, unsupported lines or insufficient comparable data.

Safeguards:
- Never compare an original total with an outstanding balance.
- When only an outstanding amount is provided, show any reference match but require amount review.
- Credits, partial payments, cancellations and duplicate statement lines require review.
- Use decimal arithmetic or integer minor units with a documented rounding policy.
- A mismatch must not automatically imply missing documents, unpaid debt or accounting errors.
- Abort on API failures or incomplete retrieval. Never label an incomplete run successful.

## Report
Show run status, supplier, currency, dates, counts by result and every statement line.

For each exception, show original document values, source page/row, any matching Xero bill ID/link, compared values, reason and suggested review action.

Keep uncertainty visible. The follow-up draft must describe observations without inventing explanations or asserting debts.

## Architecture and Security
Use n8n for orchestration and a small, testable TypeScript matching module. No private Bjorvand backend dependency.

Separate extraction, validation, Xero retrieval, matching and reporting. No dashboard, user accounts or billing system.

Use least-privilege read-only Xero access. Store credentials securely, never in exported templates or logs. Run in an operator-controlled environment. Minimize stored data; document log retention settings.

Publish only synthetic data and code cleared for public release. Explain external AI processing, prerequisites and usage costs.

## Acceptance Tests
Cover exact matches, absent references, amount differences, paid bills, ambiguous candidates, partial payments, credits, duplicate lines, extraction failures, unsupported currencies and paginated API results.

API failure or truncated retrieval must never produce a successful report or false “not found” results.

A fresh installation must reproduce fixture results. Also document an end-to-end run against a Xero test organization.

## Publication
Deliver:
- GitHub repository with source, license, tests, fixtures and setup guide.
- Importable n8n template submitted for directory review.
- English YouTube demo, showing results first.
- `/en` and `/en/workflows/xero-supplier-statement-checker` on Bjorvand AI, reusing the existing design.

The workflow page must show the demo, limitations, prerequisites and two actions: **Download the workflow** and **Get this workflow implemented**. Forms and booking steps must work in English. Keep the Norwegian site available.

## Milestones
**First build:** Reproduce a predefined exception report from synthetic data, then connect document extraction and Xero.

**Commercial target by 15 October 2026:** Publish one working release, test it in three real workflows with permission, and secure one paid implementation. Target, not forecast.