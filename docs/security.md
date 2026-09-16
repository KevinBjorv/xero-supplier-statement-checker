# Data handling and operations

Only an authenticated operator with workflow-execution permission can use the
form. Deploy n8n behind HTTPS with access restricted to the accounting team.
The local verification instance listens only on `127.0.0.1`.

Use fresh read-only Xero scopes, encrypted n8n credentials, a backed-up n8n
encryption key and the normal OAuth refresh mechanism. Do not use n8n's built-in
Xero credential, because its scope configuration requests accounting writes.
Do not store tokens in workflow nodes, source control or terminal output.

The workflow disables saved successful, failed and manual execution payloads.
Waiting forms still require n8n to persist their current data. A 24-hour Form
timeout and an explicit confirmation-age check reject abandoned reviews.
For self-hosted deployments, enable execution pruning and set
`EXECUTIONS_DATA_MAX_AGE=24`. Confirm binary pruning matches your storage mode.
On Cloud, review the workspace plan's available retention controls before
processing real data. Instance backups may retain deleted execution data;
document and configure their retention separately.

Keep routine operational logs to execution ID, stage, status, counts and duration.
Do not enable full HTTP payload logging for customer statements. Use synthetic
fixtures for debugging. Deleting execution records is not proof that backups or
provider logs have been deleted. Operators control retention of downloaded ZIPs.

PDF text may contain sensitive accounting data. Obtain appropriate permission
for OpenAI processing before enabling PDFs. No Xero bill data is sent to OpenAI.
Requests have no tools, use structured output and `store: false`, but provider
abuse-monitoring retention is separate. Do not claim zero retention without an
applicable provider agreement and verified configuration.

Document text is untrusted. The model cannot change scopes, network destinations,
supplier selection or matching rules. Source excerpts are validated. Reports
escape HTML, use a restrictive CSP, and prevent CSV formula execution. Raw
document strings stay available in JSON for faithful review.

For a failed Xero fetch: fix permissions/connectivity, wait out provider limits,
then restart the complete run. Never combine an old partial fetch with a later
successful fetch. Errors after an earlier successful page must remain failures.

Before sharing a workflow: export inactive, remove credentials and pinned data,
verify bundled code against source, run tests, and inspect the release file list.
Only synthetic fixtures and approved public source belong in the repository.
