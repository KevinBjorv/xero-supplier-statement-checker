import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { context, statement, retrieval } from '../fixtures/fixture.ts';
import { checkStatement, reportFiles } from '../src/index.ts';
const load=(name:string)=>JSON.parse(readFileSync(new URL(`../workflows/${name}.json`,import.meta.url),'utf8'));
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
test('bundled Code node produces byte-identical reports',async()=>{
  const workflow=load('fixture-verification');const render=workflow.nodes.find((n:{name:string})=>n.name==='Create report files');
  const output=await new AsyncFunction('$json','Buffer',render.parameters.jsCode)({context,lines:statement,retrieval},Buffer);
  const actual=Object.fromEntries(Object.values(output[0].binary).map((file:any)=>[file.fileName,Buffer.from(file.data,'base64').toString('utf8')]));
  assert.deepEqual(actual,reportFiles(checkStatement(context,statement,retrieval)));
});
test('export is inactive, credential-free, authenticated and Xero read-only',()=>{
  const workflow=load('xero-supplier-statement-checker');assert.equal(workflow.active,false);assert.deepEqual(workflow.pinData,{});
  assert.equal(workflow.settings.saveDataSuccessExecution,'none');
  for(const node of workflow.nodes){
    assert.ok(!node.credentials);assert.ok(!/emailSend|gmail|outlook|xero$/i.test(node.type));
    if(node.type==='n8n-nodes-base.formTrigger')assert.equal(node.parameters.authentication,'n8nUserAuth');
    if(node.type==='n8n-nodes-base.httpRequest'&&node.parameters.url.includes('xero.com')){
      assert.equal(node.parameters.method,'GET');assert.equal(node.parameters.genericAuthType,'oAuth2Api');
      assert.equal(node.parameters.options.response.response.responseFormat,'text');
      assert.ok(!JSON.stringify(node.parameters).includes('If-Modified-Since'));
    }
  }
  assert.equal(workflow.nodes.find((n:any)=>n.name==='Extract text from every PDF page').parameters.options.joinPages,false);
});
test('workflow edges reference existing nodes and all non-note nodes connect',()=>{
  const workflow=load('xero-supplier-statement-checker');const names=new Set(workflow.nodes.map((n:any)=>n.name));const reachable=new Set<string>();
  const visit=(name:string)=>{if(reachable.has(name))return;reachable.add(name);for(const branch of workflow.connections[name]?.main??[])for(const edge of branch){assert.ok(names.has(edge.node));visit(edge.node);}};
  visit('Upload statement');for(const node of workflow.nodes)if(node.type!=='n8n-nodes-base.stickyNote')assert.ok(reachable.has(node.name),node.name);
});
