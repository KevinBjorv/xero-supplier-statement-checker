// The sync entry is bundled inline and uses n8n's native Buffer. The browser
// entry's Buffer polyfill needs prototype mutation, prohibited by n8n.
import { parse } from 'csv-parse/sync';
import { fail, LIMITS, type StatementLine, type Kind, type AmountMeaning } from './types.ts';
import { parseAmount } from './money.ts';
import { dateValue } from './validation.ts';

export interface CsvOptions {
  file: string; currency: string; delimiter: ',' | ';' | '\t';
  dateFormat: 'ISO' | 'DMY' | 'MDY'; numberFormat: 'decimal_dot' | 'decimal_comma';
  columns: { reference: string; date?: string; currency?: string; originalTotal?: string; outstanding?: string; kind?: string; amountMeaning?: string; sourcePage?: string; sourceRow?: string; sourceId?: string };
  amountMeaning: AmountMeaning;
}
export const CANONICAL_COLUMNS = { reference: 'reference', date: 'date', currency: 'currency', originalTotal: 'original_total', outstanding: 'outstanding', kind: 'kind', amountMeaning: 'amount_meaning', sourcePage: 'source_page', sourceRow: 'source_row', sourceId: 'source_id' };
export function readCsv(text: string, delimiter: CsvOptions['delimiter']): string[][] {
  if (text.includes('\uFFFD') || text.includes('\0')) fail('UNSUPPORTED_ENCODING', 'Upload UTF-8 CSV.');
  try {
    const rows = parse(text, { bom: true, delimiter, skip_empty_lines: true, cast: false, max_record_size: 200000 }) as string[][];
    if (rows.length > LIMITS.rows + 1) fail('ROW_LIMIT', `Maximum ${LIMITS.rows} transaction rows.`);
    return rows;
  } catch (error) {
    if (error instanceof Error && error.name === 'CheckError') throw error;
    fail('INVALID_CSV', 'CSV quoting, field counts, or delimiter are invalid.');
  }
}
export function extractCsv(text: string, options: CsvOptions): StatementLine[] {
  const [headers, ...rows] = readCsv(text, options.delimiter);
  if (!headers || !rows.length) fail('EMPTY_STATEMENT', 'CSV must contain a header and transaction rows.');
  if (new Set(headers).size !== headers.length) fail('DUPLICATE_HEADER', 'CSV headers must be unique.');
  for (const [key, column] of Object.entries(options.columns)) {
    if (column && !headers.includes(column) && !['kind', 'amountMeaning', 'sourcePage', 'sourceRow', 'sourceId'].includes(key)) fail('MISSING_COLUMN', `Mapped column is absent: ${column}`);
  }
  if (!headers.includes(options.columns.reference)) fail('REFERENCE_MAPPING_REQUIRED', 'Map an invoice-reference column.');
  return rows.map((record, index) => {
    const raw = Object.fromEntries(headers.map((header, i) => [header, record[i]]));
    const get = (key: keyof CsvOptions['columns']) => raw[options.columns[key] ?? ''] ?? '';
    const issues: string[] = [];
    const amount = (key: 'originalTotal' | 'outstanding') => {
      try { return parseAmount(get(key), options.numberFormat); }
      catch { issues.push(`INVALID_${key.toUpperCase()}`); return null; }
    };
    let date: string | null = null;
    try { date = dateValue(get('date'), options.dateFormat); } catch { issues.push('INVALID_DATE'); }
    const kindText = get('kind').trim() || 'invoice';
    const kind = (['invoice', 'credit', 'payment', 'balance_forward', 'cancellation', 'other'].includes(kindText) ? kindText : 'other') as Kind;
    const meaningText = get('amountMeaning').trim() || options.amountMeaning;
    const meaning = (['tax_inclusive_original', 'tax_exclusive', 'unknown'].includes(meaningText) ? meaningText : 'unknown') as AmountMeaning;
    const sourceRow = get('sourceRow') ? Number(get('sourceRow')) : index + 2;
    const page = get('sourcePage') ? Number(get('sourcePage')) : undefined;
    if (!Number.isInteger(sourceRow) || sourceRow < 1 || (page !== undefined && (!Number.isInteger(page) || page < 1))) fail('INVALID_SOURCE', 'Source page and row must be positive integers.');
    return { id: get('sourceId') || `csv-${index + 2}`, kind, reference: get('reference').trim() || null,
      date, currency: get('currency').trim().toUpperCase() || options.currency,
      originalTotal: amount('originalTotal'), outstanding: amount('outstanding'), amountMeaning: meaning,
      raw, source: { file: options.file, row: sourceRow, ...(page ? { page } : {}) }, issues };
  });
}
export function csvCell(value: unknown, spreadsheetSafe = false): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (spreadsheetSafe && /^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function canonicalCsv(lines: StatementLine[]): string {
  const headers = ['source_id', 'source_page', 'source_row', 'kind', 'reference', 'date', 'currency', 'original_total', 'outstanding', 'amount_meaning'];
  return [headers, ...lines.map(line => [line.id, line.source.page ?? '', line.source.row, line.kind, line.reference, line.date, line.currency, line.originalTotal, line.outstanding, line.amountMeaning])].map(row => row.map(value => csvCell(value)).join(',')).join('\r\n');
}
