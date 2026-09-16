import { LIMITS, fail, type StatementLine, type RunContext } from './types.ts';
import { minor, precision } from './money.ts';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function referenceKey(value: string): string {
  return value.normalize('NFC').trim().replace(/[a-z]/g, letter => letter.toUpperCase());
}
export function dateValue(raw: string, format: 'ISO' | 'DMY' | 'MDY'): string | null {
  if (!raw.trim()) return null;
  let year: string, month: string, day: string;
  if (format === 'ISO') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
    if (!m) fail('INVALID_DATE', 'Expected YYYY-MM-DD.');
    [, year, month, day] = m;
  } else {
    const m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(raw.trim());
    if (!m) fail('INVALID_DATE', `Expected ${format} with a four-digit year.`);
    year = m[3]; month = format === 'DMY' ? m[2] : m[1]; day = format === 'DMY' ? m[1] : m[2];
  }
  const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const date = new Date(`${result}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== result) fail('INVALID_DATE', 'Invalid calendar date.');
  return result;
}
export function validateContext(context: RunContext): void {
  if (!UUID.test(context.tenantId) || !UUID.test(context.supplierId)) fail('INVALID_SCOPE', 'Select a valid tenant and supplier.');
  precision(context.currency);
  if (!dateValue(context.statementDate, 'ISO')) fail('STATEMENT_DATE_REQUIRED', 'Statement date is required.');
  if (!context.runId || !context.fileName || !/^[a-f0-9]{64}$/i.test(context.fileHash)) fail('INVALID_PROVENANCE', 'Run identity and SHA-256 file hash are required.');
  if (!Number.isFinite(Date.parse(context.startedAt))) fail('INVALID_RUN_TIME', 'Run start time is required.');
}
export function validateLines(lines: StatementLine[], context: RunContext): StatementLine[] {
  if (!lines.length) fail('EMPTY_STATEMENT', 'No statement transaction rows were extracted.');
  if (lines.length > LIMITS.rows) fail('ROW_LIMIT', `Maximum ${LIMITS.rows} rows. No rows were truncated.`);
  const ids = new Set<string>();
  return lines.map(line => {
    if (ids.has(line.id)) fail('DUPLICATE_LINE_ID', 'Every source row must have a distinct identity.');
    ids.add(line.id);
    if (!Number.isInteger(line.source.row) || line.source.row < 1 || !line.source.file) fail('INVALID_SOURCE', 'Every row requires a source reference.');
    const issues = [...line.issues];
    if (!line.reference || !referenceKey(line.reference)) issues.push('MISSING_REFERENCE');
    if (line.currency !== context.currency) issues.push('CURRENCY_DIFFERENCE');
    if (line.kind !== 'invoice') issues.push('UNSUPPORTED_LINE_TYPE');
    if (line.date && line.date > context.statementDate) issues.push('DATE_AFTER_STATEMENT');
    if (line.amountMeaning !== 'tax_inclusive_original') issues.push('UNCONFIRMED_AMOUNT_MEANING');
    if (line.originalTotal === null) issues.push('NO_ORIGINAL_TOTAL');
    for (const value of [line.originalTotal, line.outstanding]) {
      if (value !== null) {
        try { if (minor(value, context.currency) < 0n) issues.push('NEGATIVE_AMOUNT'); }
        catch { issues.push('INVALID_OR_EXCESS_PRECISION_AMOUNT'); }
      }
    }
    if (!issues.includes('INVALID_OR_EXCESS_PRECISION_AMOUNT') && line.originalTotal !== null && line.outstanding !== null) {
      const total = minor(line.originalTotal, context.currency), due = minor(line.outstanding, context.currency);
      if (due > 0n && due < total) issues.push('PARTIAL_PAYMENT_ON_STATEMENT');
      if (due > total) issues.push('OUTSTANDING_EXCEEDS_ORIGINAL');
    }
    return { ...line, issues: [...new Set(issues)] };
  });
}
