import { readFile, writeFile } from 'node:fs/promises';

// This illustration uses the real golden report, never invented customer data.
const report = JSON.parse(await readFile('fixtures/expected/report.json', 'utf8'));
const difference = report.lines.find(row => row.result === 'amount_difference');
const outstanding = report.lines.find(row => row.line.reference === 'INV-107');
if (!difference?.comparison || !outstanding || outstanding.comparison !== null) {
  throw new Error('Fixture changed: review the repository preview before publishing.');
}
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const stats = [
  ['matched', 'Matched', '#216c51'],
  ['amount_difference', 'Amount difference', '#a44620'],
  ['not_found', 'Not found in retrieval', '#945821'],
  ['review_required', 'Review required', '#59615a'],
];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="760" viewBox="0 0 1280 760" role="img" aria-labelledby="title description">
<title id="title">Synthetic supplier statement report: ${report.lines.length} rows, ${report.counts.matched} matched, ${report.counts.amount_difference} amount difference, ${report.counts.not_found} not found, ${report.counts.review_required} for review</title>
<desc id="description">A data preview generated from fixtures/expected/report.json. ${escape(difference.line.reference)} has original totals ${escape(difference.comparison.statementOriginal)} versus ${escape(difference.comparison.xeroOriginal)} ${escape(report.context.currency)}. ${escape(outstanding.line.reference)} has only an outstanding amount and is not compared automatically.</desc>
<rect width="1280" height="760" rx="20" fill="#f6f2e9"/>
<g font-family="Arial,Helvetica,sans-serif" fill="#183331">
<text x="48" y="54" font-size="14" font-weight="700" letter-spacing="2">SYNTHETIC REPORT / DATA PREVIEW</text>
<text x="48" y="116" font-size="38" font-weight="700">Every exception has a reason.</text>
<text x="48" y="153" font-size="18" fill="#58645d">${escape(report.context.supplierName)} · ${escape(report.context.currency)} · ${escape(report.context.statementDate)}</text>
${stats.map(([key,label,color],i) => `<g transform="translate(${48+i*302},188)"><rect width="278" height="116" rx="10" fill="#ffffff" stroke="#dddace"/><text x="22" y="57" font-size="42" font-weight="700" fill="${color}">${report.counts[key]}</text><text x="22" y="88" font-size="16">${label}</text></g>`).join('\n')}
<rect x="48" y="334" width="1184" height="160" rx="10" fill="#ffffff" stroke="#dddace"/>
<path d="M48 347v134" stroke="#b45b30" stroke-width="6"/>
<text x="76" y="375" font-size="21" font-weight="700">${escape(difference.line.reference)} · Amount difference</text>
<text x="76" y="413" font-size="17">Statement original: ${escape(difference.comparison.statementOriginal)} ${escape(report.context.currency)}</text>
<text x="508" y="413" font-size="17">Xero original: ${escape(difference.comparison.xeroOriginal)} ${escape(report.context.currency)}</text>
<text x="925" y="413" font-size="17" font-weight="700">Difference: ${escape(difference.comparison.difference)}</text>
<text x="76" y="458" font-size="16" fill="#58645d">${escape(difference.line.source.file)} · source row ${difference.line.source.row} · Compare the source invoice and both recorded totals.</text>
<rect x="48" y="516" width="1184" height="154" rx="10" fill="#ffffff" stroke="#dddace"/>
<path d="M48 529v128" stroke="#718176" stroke-width="6"/>
<text x="76" y="557" font-size="21" font-weight="700">${escape(outstanding.line.reference)} · Review required</text>
<text x="76" y="596" font-size="17">Outstanding: ${escape(outstanding.line.outstanding)} ${escape(report.context.currency)}</text>
<text x="508" y="596" font-size="17">Original total: not provided</text>
<text x="76" y="636" font-size="16" fill="#58645d">Reference candidate retained. No safe original-total comparison.</text>
<text x="48" y="716" font-size="15" fill="#58645d">${report.lines.length} source rows retained in HTML, CSV and JSON. All example data is fictional.</text>
</g></svg>\n`;
const path = 'docs/assets/report-preview.svg';
if (process.argv.includes('--check')) {
  if (await readFile(path, 'utf8') !== svg) throw new Error('Stale report preview: run npm run docs:assets.');
} else await writeFile(path, svg);
console.log('Repository report preview matches the golden fixture.');
