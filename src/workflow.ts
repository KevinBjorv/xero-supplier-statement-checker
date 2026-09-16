import * as C from './index.ts';
export interface State {
  context: C.RunContext; csvText?: string; numberFormat: 'decimal_dot'|'decimal_comma'; dateFormat: 'ISO'|'DMY'|'MDY'; delimiter: ','|';'|'\t';
  lines: C.StatementLine[]; contacts: { id: string; name: string }[]; contactPages: C.PageEvidence[];
  retrieval: C.Retrieval; page: number; attempt: number; route: number; delay: number;
  error?: string; model: string; aiEnabled: boolean; fields?: unknown[]; review?: C.ReviewEvidence;
  report?: C.Report; reviewOpenedAt?: string; pdfWarnings?: string[];
}
export const field = (name: string, label: string, type = 'text', extra: Record<string,unknown> = {}) => ({ fieldName: name, fieldLabel: label, fieldType: type, ...extra });
const select = (name: string,label: string,values: string[],requiredField=true) => field(name,label,'dropdown',{ fieldOptions: {values:values.map(option=>({option}))},requiredField });
const confirmed = (value: unknown, expected: string) => value === expected || (Array.isArray(value) && value.includes(expected));
export function workflowError(state: State, error: unknown): State {
  return { ...state, error: C.errorMessage(error), route: 3 };
}
export function acceptPage(state: State, response: { statusCode?: number; body?: unknown; data?: unknown; headers?: Record<string,string>; error?: unknown }, resource: 'Contacts'|'Invoices', now: string): State {
  // n8n's restricted Code sandbox does not expose structuredClone. State is
  // deliberately JSON-safe: monetary values are strings, never BigInt here.
  state=JSON.parse(JSON.stringify(state)) as State;
  try {
    const status=response.statusCode ?? 0;
    if(status!==200) {
      const delay=C.retryDelay(status,response.headers?.['retry-after'],state.attempt);
      if(delay!==null) return {...state,route:1,delay,attempt:state.attempt+1};
      C.fail('XERO_REQUEST_FAILED',`Xero ${resource} request failed (${status || 'network error'}). No matching conclusions are valid.`);
    }
    const body=response.body ?? response.data;
    if(typeof body!=='string') C.fail('RAW_RESPONSE_REQUIRED','Xero response must be raw text for lossless amount parsing.');
    if(resource==='Contacts') {
      const value=C.parseApi(body);
      if(!Array.isArray(value.Contacts)) C.fail('CONTACT_RESPONSE_INVALID','Xero did not return contacts.');
      const contacts=value.Contacts.map((contact: {ContactID?: unknown;Name?: unknown})=>{
        if(typeof contact.ContactID!=='string'||!C.UUID.test(contact.ContactID)||typeof contact.Name!=='string') C.fail('CONTACT_RESPONSE_INVALID','Xero contact identity is invalid.');
        return {id:contact.ContactID,name:contact.Name};
      });
      state.contacts.push(...contacts); state.contactPages.push(C.pageEvidence(value,contacts.map(c=>c.id),state.page,100,now));
      if(C.needsNextPage(state.contactPages)) return {...state,page:state.page+1,attempt:0,route:0,delay:1};
      C.validatePages(state.contactPages);
      if(!state.contacts.length) C.fail('NO_CONTACTS','No contacts are available in the selected organization.');
      state.fields=[select('supplier','Select the statement supplier',state.contacts.map(c=>`${c.name} [${c.id}]`)),field('confirmSupplier','Confirm the selected supplier matches the statement','checkbox',{fieldOptions:{values:[{option:'I confirm the supplier identity'}]},requiredField:true})];
    } else {
      const parsed=C.parseBillPage(body,state.page,100,now);state.retrieval.pages.push(parsed.evidence);state.retrieval.bills.push(...parsed.bills);
      if(C.needsNextPage(state.retrieval.pages)) return {...state,page:state.page+1,attempt:0,route:0,delay:1};
      state.retrieval.finishedAt=now; C.validateRetrieval(state.retrieval,state.context);
    }
    return {...state,route:2,attempt:0};
  } catch(error) {return workflowError(state,error);}
}
export function selectSupplier(state: State, form: Record<string,unknown>): State {
  try {
    const supplier=state.contacts.find(c=>`${c.name} [${c.id}]`===form.supplier);
    if(!supplier||!confirmed(form.confirmSupplier,'I confirm the supplier identity')) C.fail('SUPPLIER_REQUIRED','Select and confirm a supplier.');
    state.context={...state.context,supplierId:supplier.id,supplierName:supplier.name};
    if(state.context.inputType==='csv') {
      const headers=C.readCsv(state.csvText!,state.delimiter)[0];
      const optional=['(not present)',...headers];
      state.fields=[field('mapping_help','','html',{html:'<p>Map original invoice totals separately from outstanding balances. Generic Amount columns have no assumed meaning.</p>'}),
        select('reference','Invoice reference column',headers),select('date','Invoice date column',optional),select('currency','Currency column',optional),
        select('originalTotal','Original invoice total column',optional),select('outstanding','Outstanding amount column',optional),select('kind','Transaction type column',optional),
        select('meaning','Meaning of the original-total column',['tax_inclusive_original','tax_exclusive','unknown'])];
      state.route=0;
    } else {if(!state.aiEnabled)C.fail('AI_DISABLED','Enable optional AI extraction and configure the OpenAI credential, or upload CSV.'); state.route=1;}
    return state;
  } catch(error){return workflowError(state,error);}
}
export function reviewFields(state: State, now: string): State {
  state.lines=C.validateLines(state.lines,state.context);
  state.reviewOpenedAt=now;
  state.fields=[field('preview','','html',{html:`<p><strong>${C.escapeHtml(state.context.supplierName)}</strong> · ${C.escapeHtml(state.context.currency)} · ${C.escapeHtml(state.context.statementDate)}</p>${state.pdfWarnings?.map(w=>`<p>${C.escapeHtml(w)}</p>`).join('')??''}${C.previewHtml(state.lines)}<p>Review against the original file, including rows possibly omitted during PDF extraction. Keep every existing source ID, page and row. Add any missing PDF rows with a new ID and its source page.</p>`}),
    field('correctedCsv','Confirm or correct extracted rows (canonical CSV)','textarea',{defaultValue:C.canonicalCsv(state.lines),requiredField:true}),
    select('decision','Continue or cancel',['Confirm and check Xero','Cancel']),
    field('coverage','I checked supplier, currency, original-total meanings and every statement transaction','checkbox',{fieldOptions:{values:[{option:'Coverage and values confirmed'}]}})];
  state.route=2;return state;
}
export function mapCsv(state: State, form: Record<string,unknown>, now: string): State {
  try {
    const column=(name:string)=>typeof form[name]==='string'&&form[name]!=='(not present)'?form[name] as string:undefined;
    state.lines=C.extractCsv(state.csvText!,{file:state.context.fileName,currency:state.context.currency,delimiter:state.delimiter,dateFormat:state.dateFormat,numberFormat:state.numberFormat,
      columns:{reference:column('reference')??'',date:column('date'),currency:column('currency'),originalTotal:column('originalTotal'),outstanding:column('outstanding'),kind:column('kind')},amountMeaning:form.meaning as C.AmountMeaning});
    return reviewFields(state,now);
  } catch(error){return workflowError(state,error);}
}
export function acceptReview(state: State, form: Record<string,unknown>, now: string): State {
  try {
    if(form.decision==='Cancel') {
      state.report=C.failedReport(state.context,state.lines,new C.CheckError('CANCELLED','Operator cancelled the run.'));
      state.report.status='cancelled';state.route=3;return state;
    }
    if(form.decision!=='Confirm and check Xero'||!confirmed(form.coverage,'Coverage and values confirmed')||typeof form.correctedCsv!=='string') C.fail('REVIEW_REQUIRED','The form expired or confirmation is missing.');
    const corrected=C.extractCsv(form.correctedCsv,{file:state.context.fileName,currency:state.context.currency,delimiter:',',dateFormat:'ISO',numberFormat:'decimal_dot',columns:C.CANONICAL_COLUMNS,amountMeaning:'unknown'});
    if(state.context.inputType==='pdf' && corrected.some(line=>!line.source.page||line.source.page>(state.context.extraction?.pageCount??0))) C.fail('INVALID_SOURCE_PAGE','Every PDF row must refer to a page in the uploaded document.');
    state.review=C.confirmReview(state.lines,corrected,state.reviewOpenedAt!,now,true);
    state.lines=state.review.confirmedLines;state.context.reviewConfirmedAt=now;
    C.validateContext(state.context);
    state.retrieval={tenantId:state.context.tenantId,contactId:state.context.supplierId,resource:'Invoices',type:'ACCPAY',startedAt:now,finishedAt:now,pages:[],bills:[]};
    state.page=1;state.attempt=0;state.route=2;return state;
  }catch(error){return workflowError(state,error);}
}
export function makeReport(state: State): C.Report {
  const report=state.report??(state.error?C.failedReport(state.context,state.lines,new C.CheckError('WORKFLOW_FAILED',state.error),state.retrieval):C.checkStatement(state.context,state.lines,state.retrieval,state.review));
  if(state.review)report.review=state.review;
  return report;
}
