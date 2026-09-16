"""Verify the browser-downloaded synthetic ZIP against the golden files."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib
import json
import sys

root = Path(__file__).resolve().parent.parent
download = Path(sys.argv[1])
expected = root/'fixtures'/'expected'
names = ['report.json','report.csv','report.html','follow-up-draft.txt']
with ZipFile(download) as archive:
    assert sorted(archive.namelist()) == sorted(names), archive.namelist()
    for name in names:
        assert archive.read(name) == (expected/name).read_bytes(), name
evidence = {'browserDownloadVerified': True, 'files': names,
            'sha256': hashlib.sha256(download.read_bytes()).hexdigest()}
(root/'output'/'verification').mkdir(parents=True,exist_ok=True)
(root/'output'/'verification'/'browser-download.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf8')
# Deterministic synthetic sample archive for a release asset.
release = root/'output'/'release'
release.mkdir(parents=True,exist_ok=True)
with ZipFile(release/'sample-report.zip','w',ZIP_DEFLATED) as archive:
    for name in names:
        entry=ZipInfo(name,date_time=(2026,9,16,0,0,0));entry.compress_type=ZIP_DEFLATED
        archive.writestr(entry,(expected/name).read_bytes())
print(json.dumps(evidence))
