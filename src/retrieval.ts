import { parse, isLosslessNumber } from 'lossless-json';
import { fail, LIMITS, type Bill, type PageEvidence, type Retrieval, type RunContext } from './types.ts';
import { UUID } from './validation.ts';
export function parseApi(text: string): Record<string, unknown> {
  try {
    const value = parse(text) as Record<string, unknown>;
    if (!value || Array.isArray(value) || typeof value !== 'object') fail('INVALID_RESPONSE', 'Xero response must be an object.');
    return value;
  } catch { fail('INVALID_RESPONSE', 'Xero response could not be parsed completely.'); }
}
function scalar(value: unknown): string {
  if (typeof value === 'string') return value;
  if (isLosslessNumber(value)) return value.value;
  fail('INVALID_RESPONSE_FIELD', 'Required Xero field is absent or not a lossless value.');
}
function count(value: unknown): number {
  const result = Number(scalar(value));
  if (!Number.isSafeInteger(result) || result < 0) fail('INVALID_PAGINATION', 'Invalid pagination count.');
  return result;
}
function apiDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = scalar(value), match = /^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/.exec(text);
  const date = new Date(match ? Number(match[1]) : text);
  if (!Number.isFinite(date.getTime())) fail('INVALID_RESPONSE_DATE', 'Invalid Xero date.');
  return date.toISOString();
}
export function pageEvidence(body: Record<string, unknown>, ids: string[], page: number, pageSize: number, fetchedAt: string): PageEvidence {
  const p = (body.Pagination ?? body.pagination) as Record<string, unknown> | undefined;
  if (p && (count(p.Page ?? p.page) !== page || count(p.PageSize ?? p.pageSize) !== pageSize)) fail('PAGINATION_MISMATCH', 'Xero returned an unexpected page or page size.');
  if (ids.length > pageSize) fail('PAGE_TOO_LARGE', 'Xero exceeded the requested page size.');
  return { page, pageSize, pageCount: p ? count(p.PageCount ?? p.pageCount) : null, itemCount: p ? count(p.ItemCount ?? p.itemCount) : null, ids, status: 200, fetchedAt };
}
export function parseBillPage(text: string, page: number, pageSize: number, fetchedAt: string): { bills: Bill[]; evidence: PageEvidence } {
  const body = parseApi(text);
  if (!Array.isArray(body.Invoices)) fail('INVALID_INVOICE_RESPONSE', 'Xero did not return an invoice collection.');
  const bills = body.Invoices.map((raw: Record<string, unknown>): Bill => {
    const contact = raw.Contact as Record<string, unknown>;
    const bill: Bill = { id: scalar(raw.InvoiceID), contactId: scalar(contact?.ContactID), type: scalar(raw.Type),
      invoiceNumber: raw.InvoiceNumber === undefined ? '' : scalar(raw.InvoiceNumber), reference: raw.Reference == null ? '' : scalar(raw.Reference),
      currency: scalar(raw.CurrencyCode), status: scalar(raw.Status), total: scalar(raw.Total),
      amountDue: scalar(raw.AmountDue), amountPaid: scalar(raw.AmountPaid), amountCredited: scalar(raw.AmountCredited),
      date: apiDate(raw.DateString ?? raw.Date)?.slice(0, 10) ?? null, updatedAt: apiDate(raw.UpdatedDateUTCString ?? raw.UpdatedDateUTC) };
    if (!UUID.test(bill.id) || !UUID.test(bill.contactId)) fail('INVALID_BILL_ID', 'Xero returned an invalid identifier.');
    return bill;
  });
  return { bills, evidence: pageEvidence(body, bills.map(bill => bill.id), page, pageSize, fetchedAt) };
}
export function validatePages(pages: PageEvidence[]): void {
  if (!pages.length || pages.length > LIMITS.apiPages) fail('INCOMPLETE_RETRIEVAL', 'Missing pages or retrieval limit exceeded.');
  const ids = new Set<string>(), first = pages[0];
  for (const [index, page] of pages.entries()) {
    if (page.status !== 200 || page.page !== index + 1 || page.pageSize !== first.pageSize || page.pageSize < 1 || page.ids.length > page.pageSize || !Number.isFinite(Date.parse(page.fetchedAt))) fail('INCOMPLETE_RETRIEVAL', 'Page sequence or response is invalid.');
    if (page.pageCount !== first.pageCount || page.itemCount !== first.itemCount) fail('CHANGING_RETRIEVAL', 'Pagination counts changed during retrieval. Run again.');
    for (const id of page.ids) {
      if (!UUID.test(id) || ids.has(id)) fail('REPEATED_RECORD', 'Duplicate or invalid record ID in paginated results.');
      ids.add(id);
    }
    if (index < pages.length - 1 && !page.ids.length) fail('EARLY_EMPTY_PAGE', 'Retrieval continued after an empty page.');
  }
  const last = pages.at(-1)!;
  if (first.pageCount !== null && first.itemCount !== null) {
    if (first.itemCount !== ids.size || (first.pageCount !== pages.length && !(first.pageCount === 0 && pages.length === 1 && ids.size === 0))) fail('INCOMPLETE_RETRIEVAL', 'Not every advertised record/page was retrieved.');
  } else if (first.pageCount !== null || first.itemCount !== null || last.ids.length !== 0) {
    fail('INCOMPLETE_RETRIEVAL', 'Without pagination metadata, a final empty page is required.');
  }
}
export function needsNextPage(pages: PageEvidence[]): boolean {
  const last = pages.at(-1)!;
  const next = last.pageCount === null ? last.ids.length > 0 : last.page < last.pageCount;
  if (next && pages.length >= LIMITS.apiPages) fail('RETRIEVAL_LIMIT', 'Retrieval limit reached. No successful report was generated.');
  return next;
}
export function validateRetrieval(retrieval: Retrieval, context: RunContext): void {
  if (retrieval.error) fail('RETRIEVAL_FAILED', 'Xero retrieval failed. No matching conclusions were produced.');
  if (retrieval.tenantId !== context.tenantId || retrieval.contactId !== context.supplierId || retrieval.resource !== 'Invoices' || retrieval.type !== 'ACCPAY') fail('SCOPE_MISMATCH', 'Retrieval does not match the selected tenant and supplier.');
  validatePages(retrieval.pages);
  const start = Date.parse(retrieval.startedAt), finish = Date.parse(retrieval.finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(finish) || finish < start || start < Date.parse(context.reviewConfirmedAt ?? context.startedAt)) fail('INVALID_RETRIEVAL_TIME', 'Retrieve bills after the current run confirmation.');
  const ids = retrieval.pages.flatMap(page => page.ids);
  if (ids.length !== retrieval.bills.length || ids.some((id, index) => id !== retrieval.bills[index].id)) fail('RETRIEVAL_DATA_MISMATCH', 'Bill data does not match the page evidence.');
  for (const bill of retrieval.bills) {
    if (bill.type !== 'ACCPAY' || bill.contactId !== context.supplierId) fail('BILL_SCOPE_MISMATCH', 'Unexpected supplier or invoice type in the response.');
    if (bill.updatedAt && Date.parse(bill.updatedAt) > start) fail('CHANGING_RETRIEVAL', 'A bill changed during retrieval. Run again.');
  }
}
export function retryDelay(status: number, retryAfter: string | undefined, attempt: number, now = Date.now()): number | null {
  if (attempt >= 4 || ![429, 500, 502, 503, 504].includes(status)) return null;
  const seconds = retryAfter && /^\d+(\.\d+)?$/.test(retryAfter) ? Number(retryAfter) : retryAfter ? (Date.parse(retryAfter) - now) / 1000 : 2 ** attempt;
  if (!Number.isFinite(seconds) || seconds > 300) return null;
  return Math.max(1, seconds);
}
