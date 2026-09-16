import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extractCsv } from '../src/csv.ts';
import { parseBillPage } from '../src/retrieval.ts';
import type { RunContext, Retrieval } from '../src/types.ts';
export const supplier = '11111111-1111-4111-8111-111111111111';
export const tenant = '22222222-2222-4222-8222-222222222222';
export const id = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
export const input = readFileSync(new URL('./statement.csv', import.meta.url), 'utf8');
export const context: RunContext = {
  runId: 'synthetic-example-001', tenantId: tenant, supplierId: supplier, supplierName: 'Example Office Supplies Ltd (synthetic)',
  currency: 'GBP', statementDate: '2026-08-31', fileName: 'statement.csv', fileHash: createHash('sha256').update(input).digest('hex'),
  startedAt: '2026-09-16T08:00:00.000Z', inputType: 'csv', includeDraft: true,
};
export const csvOptions = { file: 'statement.csv', currency: 'GBP', delimiter: ',' as const, dateFormat: 'ISO' as const, numberFormat: 'decimal_dot' as const,
  columns: { reference: 'reference', date: 'date', currency: 'currency', originalTotal: 'original_total', outstanding: 'outstanding', kind: 'kind', amountMeaning: 'amount_meaning' }, amountMeaning: 'tax_inclusive_original' as const };
export const statement = extractCsv(input, csvOptions);
export function rawBill(n: number, reference: string, total: string, status = 'AUTHORISED', due = total, paid = '0.00') {
  return { InvoiceID: id(n), Contact: { ContactID: supplier }, Type: 'ACCPAY', InvoiceNumber: reference, Reference: '', CurrencyCode: 'GBP',
    Status: status, Total: total, AmountDue: due, AmountPaid: paid, AmountCredited: '0.00', DateString: '2026-08-01', UpdatedDateUTC: '2026-09-01T00:00:00Z' };
}
const raw = [rawBill(1,'INV-100','120.00'), rawBill(2,'INV-101','245.00'), rawBill(3,'INV-103','65.00','PAID','0.00','65.00'),
  rawBill(4,'INV-104','200.00','AUTHORISED','100.00','100.00'), rawBill(5,'INV-106','30.00'), rawBill(6,'INV-107','60.00'), rawBill(7,'INV-108','99.00'), rawBill(8,'INV-108','99.00')];
export const apiPages = [0,1].map(index => JSON.stringify({ Invoices: raw.slice(index*4,index*4+4), Pagination: { Page:index+1, PageSize:4, PageCount:2, ItemCount:8 } }));
const parsed = apiPages.map((body, index) => parseBillPage(body, index+1, 4, '2026-09-16T08:01:00.000Z'));
export const retrieval: Retrieval = { tenantId: tenant, contactId: supplier, resource: 'Invoices', type: 'ACCPAY', startedAt: '2026-09-16T08:00:10.000Z', finishedAt: '2026-09-16T08:01:00.000Z', pages: parsed.map(page=>page.evidence), bills: parsed.flatMap(page=>page.bills) };
export const expectedCounts = { matched: 2, amount_difference: 1, not_found: 1, review_required: 6 };
