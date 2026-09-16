import { SCHEMA_VERSION, VERSION, CheckError, errorMessage, type Report, type RunContext, type StatementLine, type Retrieval, type LineResult, type ReviewEvidence } from './types.ts';
import { validateContext, validateLines, referenceKey, UUID } from './validation.ts';
import { validateRetrieval } from './retrieval.ts';
import { minor, decimal } from './money.ts';

export function billLink(id: string): string {
  if (!UUID.test(id)) return '';
  return `https://go.xero.com/AccountsPayable/View.aspx?InvoiceID=${encodeURIComponent(id)}`;
}
export function failedReport(context: RunContext, lines: StatementLine[], error: unknown, retrieval: Retrieval | null = null): Report {
  return { schemaVersion: SCHEMA_VERSION, toolVersion: VERSION, status: 'failed', context,
    retrieval: retrieval ? withoutBills(retrieval) : null, errors: [errorMessage(error)],
    warnings: ['No matching conclusions are valid for this failed run.'],
    counts: { matched: 0, amount_difference: 0, not_found: 0, review_required: lines.length },
    lines: lines.map(line => ({ line, result: 'review_required', reasons: ['RUN_FAILED_UNASSESSED'], candidates: [], comparison: null, action: 'Resolve the run failure and repeat the complete check.' })) };
}
function withoutBills(retrieval: Retrieval): Omit<Retrieval, 'bills'> {
  const { bills: _, ...manifest } = retrieval; return manifest;
}
export function checkStatement(context: RunContext, sourceLines: StatementLine[], retrieval: Retrieval, review?: ReviewEvidence): Report {
  try {
    validateContext(context);
    if (context.inputType === 'pdf' && (!review?.coverageConfirmed || review.confirmedAt !== context.reviewConfirmedAt || JSON.stringify(sourceLines) !== JSON.stringify(review.confirmedLines))) {
      throw new CheckError('PDF_REVIEW_REQUIRED','Confirm every extracted PDF line before matching.');
    }
    validateRetrieval(retrieval, context);
    const statement = validateLines(sourceLines, context);
    const counts = new Map<string, number>();
    statement.forEach(line => { const key = referenceKey(line.reference ?? ''); if (key) counts.set(key, (counts.get(key) ?? 0) + 1); });
    const results: LineResult[] = statement.map(line => {
      const key = referenceKey(line.reference ?? '');
      const referenceBills = key ? retrieval.bills.filter(bill => referenceKey(bill.invoiceNumber) === key) : [];
      const primary = referenceBills.filter(bill => bill.currency === context.currency);
      const secondary = !primary.length && key ? retrieval.bills.filter(bill => bill.currency === context.currency && referenceKey(bill.reference) === key) : [];
      const candidates = (primary.length ? primary : secondary).map(bill => ({ ...bill, link: billLink(bill.id) }));
      const reasons = [...line.issues];
      if ((counts.get(key) ?? 0) > 1) reasons.push('DUPLICATE_STATEMENT_REFERENCE');
      if (primary.length > 1) reasons.push('MULTIPLE_XERO_CANDIDATES');
      if (!primary.length && secondary.length) reasons.push('SECONDARY_REFERENCE_ONLY');
      if (!primary.length && referenceBills.length) reasons.push('REFERENCE_IN_OTHER_CURRENCY');
      let comparison: LineResult['comparison'] = null;
      if (primary.length === 1) {
        const bill = primary[0];
        if (!['AUTHORISED', 'PAID'].includes(bill.status)) reasons.push('XERO_STATUS_REQUIRES_REVIEW');
        try {
          const total = minor(bill.total, context.currency), paid = minor(bill.amountPaid, context.currency), due = minor(bill.amountDue, context.currency), credited = minor(bill.amountCredited, context.currency);
          if (total < 0n || paid < 0n || due < 0n || credited < 0n) reasons.push('NEGATIVE_XERO_AMOUNT');
          if (paid > 0n && due > 0n) reasons.push('PARTIAL_PAYMENT_IN_XERO');
          if (credited !== 0n) reasons.push('CREDIT_ALLOCATION_IN_XERO');
          if (bill.status === 'PAID' && due !== 0n) reasons.push('INCONSISTENT_XERO_STATUS');
          if (line.originalTotal !== null && line.amountMeaning === 'tax_inclusive_original') {
            const original = minor(line.originalTotal, context.currency);
            comparison = { statementOriginal: decimal(original, context.currency), xeroOriginal: decimal(total, context.currency), difference: decimal(original - total, context.currency) };
          }
        } catch { reasons.push('INVALID_XERO_OR_STATEMENT_AMOUNT'); }
      }
      if (reasons.length) return { line, result: 'review_required', candidates, comparison, reasons: [...new Set(reasons)], action: 'Review the source row and any Xero candidates. Confirm reference, amount meaning, currency and payment/credit context.' };
      if (!primary.length) return { line, result: 'not_found', candidates: [], comparison: null, reasons: ['NO_REFERENCE_IN_COMPLETE_RETRIEVAL'], action: 'Check the reference and supplier records. Absence does not establish a missing document, unpaid debt or accounting error.' };
      if (!comparison) return { line, result: 'review_required', candidates, comparison, reasons: ['NO_COMPARABLE_ORIGINAL_TOTAL'], action: 'Obtain the original tax-inclusive invoice total. Do not substitute an outstanding balance.' };
      const equal = minor(comparison.difference, context.currency) === 0n;
      return { line, result: equal ? 'matched' : 'amount_difference', candidates, comparison,
        reasons: [equal ? 'ORIGINAL_TOTALS_AGREE' : 'ORIGINAL_TOTALS_DIFFER'],
        action: equal ? 'Original totals agree. This is not a payment or balance reconciliation.' : 'Review the original invoice and both original totals; do not assume the cause of the difference.' };
    });
    const resultCounts = { matched: 0, amount_difference: 0, not_found: 0, review_required: 0 };
    results.forEach(line => resultCounts[line.result]++);
    return { schemaVersion: SCHEMA_VERSION, toolVersion: VERSION, status: 'completed', context, retrieval: withoutBills(retrieval),
      ...(review ? { review } : {}), errors: [],
      warnings: ['Current Xero data was retrieved during the recorded interval; it is not a historical or atomic snapshot at the statement date.', 'This checks statement lines against bills, not supplier balances or payments. Exceptions do not establish debts, missing documents or accounting errors.'],
      counts: resultCounts, lines: results };
  } catch (error) { const report=failedReport(context, sourceLines, error, retrieval); if(review)report.review=review; return report; }
}
