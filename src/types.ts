export const VERSION = '0.1.0';
export const SCHEMA_VERSION = '1.0';
export const LIMITS = { bytes: 10 * 1024 * 1024, pages: 50, rows: 1000, apiPages: 1000, reviewHours: 24 } as const;
export type Result = 'matched' | 'amount_difference' | 'not_found' | 'review_required';
export type RunStatus = 'awaiting_review' | 'completed' | 'failed' | 'cancelled';
export type Kind = 'invoice' | 'credit' | 'payment' | 'balance_forward' | 'cancellation' | 'other';
export type AmountMeaning = 'tax_inclusive_original' | 'tax_exclusive' | 'unknown';
export interface Source { file: string; row: number; page?: number; excerpt?: string }
export interface StatementLine {
  id: string; kind: Kind; reference: string | null; date: string | null; currency: string;
  originalTotal: string | null; outstanding: string | null; amountMeaning: AmountMeaning;
  raw: Record<string, string>; source: Source; issues: string[];
}
export interface RunContext {
  runId: string; tenantId: string; supplierId: string; supplierName: string; currency: string;
  statementDate: string; fileName: string; fileHash: string; startedAt: string;
  inputType: 'csv' | 'pdf'; includeDraft: boolean; reviewConfirmedAt?: string;
  extraction?: { model: string; promptVersion: string; pageCount: number };
}
export interface Bill {
  id: string; contactId: string; type: string; invoiceNumber: string; reference: string;
  currency: string; status: string; total: string; amountDue: string; amountPaid: string;
  amountCredited: string; date: string | null; updatedAt: string | null;
}
export interface PageEvidence {
  page: number; pageSize: number; pageCount: number | null; itemCount: number | null;
  ids: string[]; status: number; fetchedAt: string;
}
export interface Retrieval {
  tenantId: string; contactId: string; resource: 'Invoices'; type: 'ACCPAY';
  startedAt: string; finishedAt: string; pages: PageEvidence[]; bills: Bill[];
  error?: string;
}
export interface LineResult {
  line: StatementLine; result: Result; reasons: string[]; action: string;
  candidates: (Bill & { link: string })[];
  comparison: { statementOriginal: string; xeroOriginal: string; difference: string } | null;
}
export interface ReviewEvidence {
  originalLines: StatementLine[]; confirmedLines: StatementLine[];
  confirmedAt: string; coverageConfirmed: boolean;
}
export interface Report {
  schemaVersion: string; toolVersion: string; status: RunStatus; context: RunContext;
  retrieval: Omit<Retrieval, 'bills'> | null; review?: ReviewEvidence;
  errors: string[]; warnings: string[]; counts: Record<Result, number>; lines: LineResult[];
}
export class CheckError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.name = 'CheckError'; this.code = code; }
}
export function fail(code: string, message: string): never { throw new CheckError(code, message); }
export function errorMessage(error: unknown): string {
  return error instanceof CheckError ? `${error.code}: ${error.message}` : 'PROCESSING_FAILED: Processing could not be completed. Check the operator configuration.';
}
