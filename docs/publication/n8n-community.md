# Read-only Xero supplier statement checker with operator review (preview)

I've published an open-source n8n workflow for a specific accounts-payable job:
checking supplier statement references and original invoice totals against Xero
purchase bills, with the evidence kept beside every result.

The synthetic example makes the distinction visible:

- INV-101: statement original 250.00 GBP, Xero original 245.00 GBP → amount difference.
- INV-107: only 45.00 GBP outstanding is supplied → review required, no unsafe comparison.
- Paid bills stay in the retrieval. Credits, partial payments, duplicates and
  ambiguous references stay visible for review.

The workflow uses authenticated forms, standard HTTP Request nodes and bundled
TypeScript Code nodes. CSV requires no AI. Optional OpenAI text-PDF extraction
must be checked and confirmed by an operator before matching. Xero access is
read-only; no entries are posted and no emails are sent.

A failed later API page invalidates the entire retrieval. The diagnostic report
then contains no matched, amount-difference or not-found conclusions.

**Status:** preview. There are 42 passing automated tests, golden reports and
local n8n CSV/PDF/failure checks. Live Xero and n8n Cloud acceptance are still
pending. The credential-free demo uses fictional data and is the starting point.

[Sample report, free workflow and setup details](https://bjorvand.ai/en/workflows/xero-supplier-statement-checker?utm_source=n8n_community&utm_medium=community&utm_campaign=xero_statement_checker)

[MIT source and tests](https://github.com/KevinBjorv/xero-supplier-statement-checker)

I'd welcome feedback on the column-mapping and review steps, especially where
statement formats make original totals and outstanding balances hard to tell
apart. Please use synthetic examples; don't post customer statements here.

Disclosure: I run Bjorvand AI. The source is free; implementation help is a
separate paid service.
