# Live Xero acceptance record

Status: **pending OAuth setup and a read-only run**. Synthetic API tests do not
prove a provider connection. No Xero records have been created or modified by
this project.

The dedicated Web app form has been prepared in the developer portal. The owner
must review its developer terms and security commitment before creating the app.
Use n8n's displayed callback URI and store the client ID/secret in the generic
OAuth2 credential. Never paste secrets into an issue, chat or this document.

Run this checklist with the selected test organization:

- Confirm organization identity from `GET /connections`; pin its tenant ID.
- Confirm granted scopes are only offline access, contacts read, invoices read.
- Authorize a fresh connection if older scopes are broader; merely editing the
  requested scope list cannot reduce an existing grant.
- Read contacts, select an existing supplier and verify the ID/name pairing.
- Check a statement prepared against existing test bills, including a paid bill.
- Verify original totals, not outstanding balances, are compared.
- Verify every advertised page and record is retrieved, including older bills.
- Confirm a current bill's deep link opens that bill in the expected organization.
- Verify token refresh using the installed OAuth credential after expiry.
- Read back report status, counts, source references, retrieval interval and ZIP.
- Revoke/disconnect the temporary integration when verification is finished if
  it is not the intended ongoing installation.

Record the tested Git commit, n8n version, date, page/count evidence and pass/fail
per item. Keep raw API responses and tenant identifiers out of the public record.
Cases absent from the test organization's data remain synthetic-only coverage
unless the operator prepares additional records outside this checker.
