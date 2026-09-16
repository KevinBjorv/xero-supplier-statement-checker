import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const target=process.argv[2];if(!target)throw Error('Pass the existing Bjorvand AI repository path.');
const root=resolve(target);const pageDir=join(root,'app/workflows/xero-supplier-statement-checker');
await mkdir(pageDir,{recursive:true});
await copyFile('site-integration/page.tsx',join(pageDir,'page.tsx'));
await copyFile('site-integration/checker.css',join(pageDir,'checker.css'));
await copyFile('site-integration/en-xero-checker.json',join(root,'i18n/en-xero-checker.json'));
const invariants=['#eksempel','eksempel','/workflows/xero-supplier-statement-checker','https://github.com/KevinBjorv/xero-supplier-statement-checker/releases/download/v0.1.0/xero-supplier-statement-checker.json','/workflow-assets/xero-statement/sample-report.html','Xero Supplier Statement Checker','INV-101','INV-107','xero-checker-header','xero-checker-hero','xero-checker-closing',...Array.from((await readFile('site-integration/page.tsx','utf8')).matchAll(/className="([^"]+)"/g),m=>m[1])];
await writeFile(join(root,'i18n/invariants-xero-checker.json'),JSON.stringify([...new Set(invariants)],null,2)+'\n');
const assets=join(root,'public/workflow-assets/xero-statement');await mkdir(assets,{recursive:true});await copyFile('fixtures/expected/report.html',join(assets,'sample-report.html'));
const sitemapPath=join(root,'app/sitemap.ts');let sitemap=await readFile(sitemapPath,'utf8');
if(!sitemap.includes('url: `${SITE_URL}/workflows/xero-supplier-statement-checker`')){
 const anchor='const pages: MetadataRoute.Sitemap = [';
 if(!sitemap.includes(anchor))throw Error('Sitemap structure changed; apply the new route manually.');
 sitemap=sitemap.replace(anchor,anchor+'\n    { url: `${SITE_URL}/workflows/xero-supplier-statement-checker`, lastModified: new Date("2026-09-16T00:00:00+02:00"), changeFrequency: "monthly", priority: 0.8 },');
 await writeFile(sitemapPath,sitemap);
}
const footerPath=join(root,'app/components/site-footer.tsx');let footer=await readFile(footerPath,'utf8');
if(!footer.includes('href="/workflows/xero-supplier-statement-checker"')){
 const anchor='<Link href="/automatisering">Arbeidsflyter og guider</Link>';
 if(!footer.includes(anchor))throw Error('Footer changed; add the workflow navigation link manually.');
 footer=footer.replace(anchor,anchor+'\n          <Link href="/workflows/xero-supplier-statement-checker">Leverandørkontroll i Xero</Link>');
 await writeFile(footerPath,footer);
}
// Existing assertion was scoped to all homepage text, which also includes the
// new navigation link. Keep its intended marquee-only integration claim check.
const validatorPath=join(root,'scripts/validate-site.mjs');let validator=await readFile(validatorPath,'utf8');
const broad='assert(!home.includes("Xero") && !home.includes("QuickBooks"), "marquee drops Xero and QuickBooks");';
if(validator.includes(broad)){
 validator=validator.replace(broad,'const marqueeLists = [...home.matchAll(/<ul\\b[^>]*class="marquee-list"[^>]*>[\\s\\S]*?<\\/ul>/g)].map(match => match[0]);\nassert(marqueeLists.length > 0, "system marquee lists exist");\nassert(marqueeLists.every(list => !list.includes("Xero") && !list.includes("QuickBooks")), "marquee drops Xero and QuickBooks");');
 await writeFile(validatorPath,validator);
}
console.log('Added the workflow source page, translation fragment, synthetic report and sitemap entry. Run npm run localize in the site repository.');
