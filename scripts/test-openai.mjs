import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pdfPages, extractionRequest, parseExtraction } from '../src/index.ts';
if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required for this explicit live verification.');
const pages=pdfPages(JSON.parse(await readFile('fixtures/n8n-pdf-pages.json','utf8')));
const model=process.env.OPENAI_MODEL||'gpt-5.6-terra';
await mkdir('output/verification',{recursive:true});
const results=[];const rows=[];
for(const [index,text] of pages.entries()){
  const request=extractionRequest(text,index+1,model);request.max_output_tokens=8000;
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(180000)});
  const data=await response.json();
  if(!response.ok)throw new Error(`OpenAI verification failed: HTTP ${response.status}, ${data.error?.code||'API error'}. No credentials logged.`);
  await writeFile(`output/verification/synthetic-response-${index+1}.json`,JSON.stringify(data,null,2));
  const parsed=parseExtraction(data,text,index+1,'statement.pdf','GBP');
  rows.push(...parsed.lines);results.push({page:index+1,model:data.model,status:data.status,usage:data.usage,warnings:parsed.warnings});
}
assert.deepEqual(rows.map(row=>row.reference),['INV-100','INV-101','INV-102','INV-103','INV-104','CR-105']);
assert.deepEqual(rows.map(row=>row.originalTotal),['120.00','250.00','80.00','65.00','200.00','-20.00']);
assert.deepEqual(rows.map(row=>row.outstanding),['120.00','250.00','80.00','0.00','100.00','-20.00']);
assert.equal(rows.at(-1).kind,'credit');
await mkdir('output/verification',{recursive:true});
await writeFile('output/verification/openai-extraction.json',JSON.stringify({checkedAt:new Date().toISOString(),syntheticOnly:true,results,rows},null,2));
console.log(JSON.stringify({passed:true,pages:pages.length,rows:rows.length,model,evidence:'output/verification/openai-extraction.json'}));
