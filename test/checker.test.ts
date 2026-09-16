import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as core from '../src/index.ts';
import { context, statement, retrieval, expectedCounts, input, csvOptions, rawBill, id } from '../fixtures/fixture.ts';
const clone = <T>(value: T): T => structuredClone(value);
test('golden mixed statement preserves every line and the expected outcomes', () => {
  const report = core.checkStatement(context, statement, retrieval);
  assert.equal(report.status, 'completed'); assert.deepEqual(report.counts, expectedCounts);
  assert.equal(report.lines.length, 10); assert.equal(report.lines[3].candidates[0].status, 'PAID');
  assert.equal(report.lines[1].comparison?.difference, '5.00');
});
test('decimal arithmetic preserves huge values and rejects silent rounding', () => {
  assert.equal(core.minor('900719925474099312345.99','GBP'), 90071992547409931234599n);
  assert.equal(core.decimal(core.minor('12.34000','GBP'),'GBP'), '12.34');
  assert.equal(core.minor('12','JPY'),12n); assert.equal(core.minor('1.234','BHD'),1234n);
  assert.throws(()=>core.minor('1.001','GBP')); assert.throws(()=>core.minor('1','ZZZ'));
});
test('reference normalization preserves punctuation, internal spaces and zeroes', () => {
  assert.equal(core.referenceKey('  inv-001 '),'INV-001');
  assert.notEqual(core.referenceKey('INV-001'),core.referenceKey('INV001'));
  assert.notEqual(core.referenceKey('INV 001'),core.referenceKey('INV001'));
  assert.notEqual(core.referenceKey('001'),core.referenceKey('1'));
});
for (const name of ['truncated','failed','repeated','changed-count','wrong-contact','wrong-tenant','newer-update','missing-page'] as const) {
  test(`retrieval ${name} fails without any matching or absence results`, () => {
    const r = clone(retrieval);
    if(name==='truncated') { r.pages.pop(); r.bills.splice(4); }
    if(name==='failed') r.error='HTTP 503';
    if(name==='repeated') r.pages[1].ids[0]=r.pages[0].ids[0];
    if(name==='changed-count') r.pages[1].itemCount=9;
    if(name==='wrong-contact') r.bills[0].contactId=id(99);
    if(name==='wrong-tenant') r.tenantId=id(99);
    if(name==='newer-update') r.bills[0].updatedAt='2026-09-16T08:00:30.000Z';
    if(name==='missing-page') r.pages[1].page=3;
    const report=core.checkStatement(context,statement,r);
    assert.equal(report.status,'failed'); assert.equal(report.counts.not_found,0); assert.equal(report.counts.matched,0); assert.equal(report.counts.amount_difference,0);
    assert.equal(core.draftText(report),null);
  });
}
test('empty complete Xero retrieval can support not found; empty unproven cannot',()=>{
  const r=clone(retrieval); r.bills=[]; r.pages=[{page:1,pageSize:100,pageCount:0,itemCount:0,ids:[],status:200,fetchedAt:r.finishedAt}];
  assert.equal(core.checkStatement(context,[statement[0]],r).lines[0].result,'not_found');
  r.pages=[]; assert.equal(core.checkStatement(context,[statement[0]],r).status,'failed');
});
test('metadata-free paging requires an explicit final empty page',()=>{
  const r=clone(retrieval); r.pages.forEach(page=>{page.pageCount=null;page.itemCount=null;});
  assert.equal(core.checkStatement(context,statement,r).status,'failed');
  r.pages.push({...r.pages[0],page:3,ids:[]}); assert.equal(core.checkStatement(context,statement,r).status,'completed');
});
for (const [name, modify] of [
  ['currency', (line:core.StatementLine,r:core.Retrieval)=>{r.bills[0].currency='USD';}],
  ['credit allocation', (line:core.StatementLine,r:core.Retrieval)=>{r.bills[0].amountCredited='10.00';}],
  ['voided', (line:core.StatementLine,r:core.Retrieval)=>{r.bills[0].status='VOIDED';}],
  ['draft', (line:core.StatementLine,r:core.Retrieval)=>{r.bills[0].status='DRAFT';}],
  ['missing reference', (line:core.StatementLine)=>{line.reference=null;}],
  ['tax exclusive', (line:core.StatementLine)=>{line.amountMeaning='tax_exclusive';}],
  ['outstanding only', (line:core.StatementLine)=>{line.originalTotal=null;}],
  ['secondary reference', (line:core.StatementLine,r:core.Retrieval)=>{r.bills[0].reference='INV-100';r.bills[0].invoiceNumber='SOMETHING-ELSE';}],
  ['invalid amount', (line:core.StatementLine)=>{line.originalTotal='120.001';}],
] as const) test(`${name} requires review`,()=>{
  const line=clone(statement[0]), r=clone(retrieval); modify(line,r);
  const report=core.checkStatement(context,[line],r); assert.equal(report.status,'completed');assert.equal(report.lines[0].result,'review_required');
});
test('zero original totals match safely',()=>{
  const line=clone(statement[0]),r=clone(retrieval);line.originalTotal='0.00';line.outstanding='0.00';r.bills[0].total='0.00';r.bills[0].amountDue='0.00';
  assert.equal(core.checkStatement(context,[line],r).lines[0].result,'matched');
});
test('a statement row in another currency never gets an amount comparison',()=>{
  const line=clone(statement[0]);line.currency='USD';
  const result=core.checkStatement(context,[line],retrieval).lines[0];
  assert.equal(result.result,'review_required');assert.equal(result.comparison,null);
});
test('review-only credits and partial payments do not produce automatic differences',()=>{
  const line=clone(statement[0]);line.kind='credit';
  assert.equal(core.checkStatement(context,[line],retrieval).lines[0].comparison,null);
  assert.equal(core.checkStatement(context,[statement[4]],retrieval).lines[0].comparison,null);
});
test('same normalized statement reference always requires review on both rows',()=>{
  const b=clone(statement[0]);b.id='second';b.reference=' inv-100 ';
  assert.equal(core.checkStatement(context,[statement[0],b],retrieval).counts.review_required,2);
});
test('lossless API parsing preserves numeric literals above safe integer range',()=>{
  const bill=rawBill(9,'BIG','1.00'); const raw=JSON.stringify({Invoices:[bill]}).replace('"Total":"1.00"','"Total":9007199254740993.01');
  assert.equal(core.parseBillPage(raw,1,100,retrieval.finishedAt).bills[0].total,'9007199254740993.01');
});
test('CSV parses UTF-8 BOM, embedded newline, semicolons and leading zeroes',()=>{
  const lines=core.extractCsv('\uFEFFref;total;note\r\n001;"1.234,50";"æ ø å\nsecond line"',{...csvOptions,delimiter:';',numberFormat:'decimal_comma',columns:{reference:'ref',originalTotal:'total'}});
  assert.equal(lines[0].reference,'001'); assert.equal(lines[0].originalTotal,'1234.50'); assert.equal(lines[0].source.row,2);assert.equal(lines[0].raw.note,'æ ø å\nsecond line');
});
test('CSV rejects malformed data, missing mappings, duplicate headers and invalid encoding',()=>{
  for(const text of ['ref,total\n"bad,1','ref,ref\na,b','ref,total\n001,\uFFFD','ref,total\na,1,extra']) assert.throws(()=>core.extractCsv(text,{...csvOptions,columns:{reference:'ref',originalTotal:'total'}}));
  assert.throws(()=>core.extractCsv(input,{...csvOptions,columns:{reference:'absent'}}));
});
test('date formats must be explicit and calendar dates valid',()=>{
  assert.equal(core.dateValue('01/02/2026','DMY'),'2026-02-01'); assert.equal(core.dateValue('01/02/2026','MDY'),'2026-01-02');
  assert.throws(()=>core.dateValue('2026-02-30','ISO'));
});
test('retry policy respects provider delay and stops on auth failures or budget',()=>{
  assert.equal(core.retryDelay(429,'30',0),30);assert.equal(core.retryDelay(503,undefined,2),4);
  assert.equal(core.retryDelay(401,undefined,0),null); assert.equal(core.retryDelay(429,'900',0),null);assert.equal(core.retryDelay(503,undefined,4),null);
});
test('PDF extraction rejects missing/scanned pages and truncated/refused output',()=>{
  assert.throws(()=>core.pdfPages({numpages:2,text:['A readable text page']}));assert.throws(()=>core.pdfPages({numpages:2,text:['A readable text page','']}));
  assert.throws(()=>core.parseExtraction({status:'incomplete',output:[]},'source',1,'source.pdf','GBP'));
  assert.throws(()=>core.parseExtraction({status:'completed',output:[{content:[{type:'refusal'}]}]},'source',1,'source.pdf','GBP'));
});
test('review cannot silently drop rows, change provenance or accept an expired session',()=>{
  assert.throws(()=>core.confirmReview(statement,statement.slice(1),context.startedAt,context.startedAt,true));
  assert.throws(()=>core.confirmReview(statement,statement,context.startedAt,'2026-09-18T00:00:00Z',true));
  const changed=clone(statement);changed[0].source.row=99;
  assert.throws(()=>core.confirmReview(statement,changed,context.startedAt,context.startedAt,true));
});
test('HTML and CSV safely render hostile supplier document values',()=>{
  const line=clone(statement[0]);line.reference='=HYPERLINK("https://evil.test")';line.raw.note='<script>alert(1)</script>';
  const report=core.checkStatement(context,[line],retrieval), html=core.reportHtml(report),csv=core.reportCsv(report);
  assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(csv.includes("'=HYPERLINK"));
});
test('golden artifact bytes are reproducible',()=>{
  const files=core.reportFiles(core.checkStatement(context,statement,retrieval));
  for(const [name,content] of Object.entries(files)) assert.equal(content,readFileSync(new URL(`../fixtures/expected/${name}`,import.meta.url),'utf8'));
});
test('recorded PDF extraction retains validated pages, amounts and every row',()=>{
  const pages=JSON.parse(readFileSync(new URL('../fixtures/n8n-pdf-pages.json',import.meta.url),'utf8'));
  const response=JSON.parse(readFileSync(new URL('../fixtures/openai-page-1.json',import.meta.url),'utf8'));
  const result=core.parseExtraction(response,pages.text[0],1,'statement.pdf','GBP');
  assert.equal(result.lines.length,3);assert.deepEqual(result.lines.map(line=>line.source.page),[1,1,1]);
  assert.ok(result.lines.every(line=>line.issues.length===0));
});
test('an invented PDF quotation aborts extraction',()=>{
  const pages=JSON.parse(readFileSync(new URL('../fixtures/n8n-pdf-pages.json',import.meta.url),'utf8'));
  const response=JSON.parse(readFileSync(new URL('../fixtures/openai-page-1.json',import.meta.url),'utf8'));
  const content=response.output[0].content[0];const extracted=JSON.parse(content.text);extracted.lines[0].original_evidence='not in the document';content.text=JSON.stringify(extracted);
  assert.throws(()=>core.parseExtraction(response,pages.text[0],1,'statement.pdf','GBP'),/source evidence/);
});
test('a fabricated extracted amount cannot inherit genuine evidence silently',()=>{
  const pages=JSON.parse(readFileSync(new URL('../fixtures/n8n-pdf-pages.json',import.meta.url),'utf8'));
  const response=JSON.parse(readFileSync(new URL('../fixtures/openai-page-1.json',import.meta.url),'utf8'));
  const content=response.output[0].content[0];const extracted=JSON.parse(content.text);extracted.lines[0].original_total='9999.00';content.text=JSON.stringify(extracted);
  const result=core.parseExtraction(response,pages.text[0],1,'statement.pdf','GBP');
  assert.ok(result.lines[0].issues.includes('AMOUNT_NOT_SUPPORTED_BY_ORIGINAL_EVIDENCE'));
});
test('unsupported or inherited currency names are rejected',()=>{
  for(const code of ['ZZZ','constructor','__proto__','XAU'])assert.throws(()=>core.precision(code));
});
