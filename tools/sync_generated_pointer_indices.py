#!/usr/bin/env python3
"""Upgrade only source-generated pointer helpers with an exact historic match.

Native C++ native_t indices become JS bigint on 64-bit targets. The old
pointer-slot helper rejected them, even for valid indices. This script never
changes game bodies or ambiguous custom helper variants.
"""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'factory-output/source-first/browser-target/source'
TEMPLATE=ROOT/'tools/source_pointer_runtime.mjs'
SNAPSHOT=ROOT/'factory-output/source-first/force-recovered/source/build/src/vfs.cpp.mjs'
REPORT=ROOT/'reports/browser-target/verified-pointer-index-upgrades.json'
ANCHOR='const cPointerElementRef = (source,index) => {'
END='const cTypedPointer ='
def extract(txt):
 start=txt.find(ANCHOR)
 if start<0:return None
 end=txt.find(END,start)
 if end<0 or txt.find(ANCHOR,start+1)>=0:raise RuntimeError('Unexpected duplicated/noncanonical pointer helper')
 return txt[start:end]
def main():
 legacy=extract(SNAPSHOT.read_text());modern=extract(TEMPLATE.read_text())
 assert legacy and modern and legacy!=modern and 'typeof index === \'bigint\'' in modern
 assert "if (!Number.isSafeInteger(index))" in legacy
 changed=[];current=[];skipped=[]
 for p in sorted(SOURCE.rglob('*.mjs')):
  text=p.read_text();existing=extract(text)
  if existing is None:continue
  if existing.rstrip()==legacy.rstrip():
   upgraded=text.replace(legacy,modern,1)
   assert upgraded.count(ANCHOR)==1
   p.write_text(upgraded)
   changed.append(str(p.relative_to(ROOT)))
  elif existing.rstrip()==modern.rstrip():current.append(str(p.relative_to(ROOT)))
  else:skipped.append(str(p.relative_to(ROOT)))
 result={'format':'eduke32-verified-pointer-index-upgrade/1','upgraded_count':len(changed),
  'already_upgraded':len(current),'unproven_custom_variants':skipped,
  'upgraded_modules':changed,'source_sha256':hashlib.sha256(modern.encode()).hexdigest(),
  'originalGameplayVerified':False}
 REPORT.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({k:v for k,v in result.items() if k!='upgraded_modules'},indent=2))
if __name__=='__main__':main()
