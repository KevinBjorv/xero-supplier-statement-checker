// Runs the shipped live graph against synthetic sources in a real local n8n
// runtime. Form inputs and external APIs are replaced; orchestration is retained.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { supplier, tenant, input, rawBill, apiPages } from '../fixtures/fixture.ts';
const mode=process.argv[2]||'csv';
if(!['csv','pdf','api-failure'].includes(mode))throw Error('Use csv, pdf or api-failure');
const workflow=JSON.parse(await readFile('workflows/xero-supplier-statement-checker.json','utf8'));
workflow.id=`checkermock${mode==='pdf'?'pdf01':mode==='csv'?'csv01':'bad01'}`;workflow.name=`Checker synthetic runtime verification (${mode})`;
const code=(name,jsCode)=>{const n=workflow.nodes.find(n=>n.name===name);if(!n)throw Error(name);n.type='n8n-nodes-base.code';n.typeVersion=2;n.parameters={jsCode};delete n.credentials;delete n.retryOnFail;delete n.onError;delete n.disabled;};
const first=workflow.nodes.find(n=>n.name==='Upload statement');first.type='n8n-nodes-base.manualTrigger';first.typeVersion=1;first.parameters={};
const pdf=mode==='pdf';const binary=pdf?await readFile('fixtures/statement.pdf'):Buffer.from(input);
code('Operator configuration',`return [{json:${JSON.stringify({tenantId:tenant,model:'gpt-5.6-terra',aiEnabled:true,currency:'GBP',statementDate:'2026-08-31',dateFormat:'ISO',numberFormat:'decimal_dot',delimiter:'comma',includeDraft:'Yes'})},binary:{statement:{data:'${binary.toString('base64')}',fileName:'statement.${pdf?'pdf':'csv'}',mimeType:'${pdf?'application/pdf':'text/csv'}'}}}];`);
const contacts=[{ContactID:supplier,Name:'Example Office Supplies Ltd (synthetic)'},...Array.from({length:100},(_,i)=>({ContactID:rawBill(i+100,'','0').InvoiceID,Name:`Synthetic contact ${i+1}`}))];
const bills=apiPages.flatMap(page=>JSON.parse(page).Invoices);for(let i=bills.length;i<101;i++)bills.push(rawBill(i+1000,`OTHER-${i}`,'1.00'));
for(const [resource,records] of [['Contacts',contacts],['Invoices',bills]]){
 code(`Fetch Xero ${resource}`,`const records=${JSON.stringify(records)};const page=$json.page;${mode==='api-failure'&&resource==='Invoices'?"if(page===2)return [{json:{statusCode:401,body:'{\"error\":\"synthetic failure\"}'}}];":''}return [{json:{statusCode:200,headers:{},body:JSON.stringify({${resource}:records.slice((page-1)*100,page*100),Pagination:{Page:page,PageSize:100,PageCount:2,ItemCount:records.length}})}}];`);
}
code('Select supplier',`return [{json:{supplier:'Example Office Supplies Ltd (synthetic) [${supplier}]',confirmSupplier:['I confirm the supplier identity']}}];`);
code('Map CSV columns',`return [{json:{reference:'reference',date:'date',currency:'currency',originalTotal:'original_total',outstanding:'outstanding',kind:'kind',meaning:'tax_inclusive_original'}}];`);
code('Confirm extracted statement',`return [{json:{correctedCsv:$json.fields.find(f=>f.fieldName==='correctedCsv').defaultValue,decision:'Confirm and check Xero',coverage:['Coverage and values confirmed']}}];`);
const responses=await Promise.all([1,2].map(i=>readFile(`fixtures/openai-page-${i}.json`,'utf8').then(JSON.parse)));
if(pdf)code('Extract PDF fields with OpenAI',`const responses=${JSON.stringify(responses)};return $input.all().map(item=>({json:responses[item.json.page-1]}));`);
// Remove download interaction; the ZIP is verified directly below.
workflow.connections['Package report ZIP']={main:[[{node:'Final run status',type:'main',index:0}]]};
workflow.nodes=workflow.nodes.filter(n=>!['Review result summary','Return prepared ZIP','Download report'].includes(n.name));
delete workflow.connections['Review result summary'];delete workflow.connections['Return prepared ZIP'];delete workflow.connections['Download report'];
await mkdir('.runtime',{recursive:true});const path=`.runtime/mock-${mode}.json`;await writeFile(path,JSON.stringify(workflow));
const n8n=process.env.N8N_BIN_PATH||'.runtime/n8n/node_modules/n8n/bin/n8n';
const env={...process.env,N8N_USER_FOLDER:resolve('.n8n'),N8N_RUNNERS_BROKER_PORT:'5681',N8N_DIAGNOSTICS_ENABLED:'false',NODE_FUNCTION_ALLOW_BUILTIN:'crypto'};
execFileSync(process.execPath,[n8n,'import:workflow',`--input=${path}`],{env,stdio:'pipe'});
let raw;try{raw=execFileSync(process.execPath,[n8n,'execute',`--id=${workflow.id}`,'--rawOutput'],{env,encoding:'utf8',maxBuffer:20*1024*1024,timeout:180000});}catch(error){raw=String(error.stdout??'');await writeFile(`.runtime/mock-${mode}.log`,raw);if(mode!=='api-failure')throw Error(`n8n execution failed; see .runtime/mock-${mode}.log`);}
await writeFile(`.runtime/mock-${mode}.log`,raw);
const execution=JSON.parse(raw.slice(raw.search(/^\{/m),raw.lastIndexOf('\n}')+2));const run=execution.data.resultData;
if(run.error&&mode!=='api-failure')throw Error(`n8n node failure: ${run.error.message}`);
if(mode==='api-failure')assert.equal(run.lastNodeExecuted,'Mark failed run');
const output=run.runData['Create report files'][0].data.main[0][0];
const reportFile=Object.values(output.binary).find(file=>file.fileName==='report.json');
const report=JSON.parse(Buffer.from(reportFile.data,'base64').toString());
assert.equal(report.status,mode==='api-failure'?'failed':'completed');
if(mode==='csv')assert.deepEqual(report.counts,{matched:2,amount_difference:1,not_found:1,review_required:6});
if(mode==='pdf'){assert.equal(report.lines.length,6);assert.equal(report.review.coverageConfirmed,true);}
if(mode==='api-failure'){assert.equal(report.counts.not_found,0);assert.equal(report.counts.matched,0);}
assert.ok(run.runData['Package report ZIP'][0].data.main[0][0].binary.reportZip);
await mkdir('output/verification',{recursive:true});
const proof={mode,verifiedAt:new Date().toISOString(),n8nVersion:'2.39.6',externalApis:'synthetic replacements',forms:'scripted confirmations',executionStatus:execution.status,status:report.status,counts:report.counts,executedNodes:Object.keys(run.runData),zip:true};
await writeFile(`output/verification/n8n-${mode}.json`,JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
