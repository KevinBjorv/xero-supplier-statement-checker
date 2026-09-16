"""Reproduce synthetic, text-based PDF fixtures. Requires reportlab and pypdf."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader
import json

root = Path(__file__).resolve().parent.parent
target = root / 'fixtures' / 'statement.pdf'
c = canvas.Canvas(str(target), pagesize=A4, invariant=1)
c.setTitle('Synthetic supplier statement - Example Office Supplies Ltd')
pages = [
    [('INV-100','2026-08-01','120.00','120.00'),('INV-101','2026-08-02','250.00','250.00'),('INV-102','2026-08-03','80.00','80.00')],
    [('INV-103','2026-08-04','65.00','0.00'),('INV-104','2026-08-05','200.00','100.00'),('CR-105','2026-08-06','-20.00','-20.00')],
]
for number, rows in enumerate(pages, 1):
    c.setFillColorRGB(.1,.14,.17)
    c.setFont('Helvetica-Bold',21);c.drawString(45,780,'Supplier statement')
    c.setFont('Helvetica',11);c.drawString(45,753,'Example Office Supplies Ltd - SYNTHETIC DATA ONLY')
    c.drawString(45,734,'Statement date: 2026-08-31 | Currency: GBP')
    c.setFont('Helvetica',10)
    c.drawString(45,695,'Original invoice total includes VAT. Outstanding is a separate balance.')
    headers = [('Reference',45),('Invoice date',153),('Original total',282),('Outstanding',420)]
    for label,x in headers:c.drawString(x,663,label)
    c.line(45,654,550,654)
    for i,row in enumerate(rows):
        for value,x in zip(row,[45,153,282,420]):c.drawString(x,629-i*36,value)
    if number == 2:c.drawString(45,490,'CR-105 is a credit note. Review required; do not match it as an invoice.')
    c.setFont('Helvetica',9);c.drawString(45,70,f'Page {number} of 2 - fictional demonstration, no customer data')
    c.showPage()
c.save()
reader=PdfReader(target)
texts=[page.extract_text() for page in reader.pages]
(root/'fixtures'/'pdf-pages.json').write_text(json.dumps({'numpages':len(texts),'text':texts},indent=2)+'\n',encoding='utf8')
print(json.dumps({'fixture':str(target),'pages':len(texts),'text_pages':all(bool(t.strip()) for t in texts)}))
