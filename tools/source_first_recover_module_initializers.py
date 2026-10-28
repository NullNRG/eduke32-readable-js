#!/usr/bin/env python3
"""Merge independently Clang-emitted original class declarations into saved modules.

Diagnostic recovery only: prove each definition through the filtered source AST,
keep every existing emitted definition, and execute the module in Node before
publishing. Never create a missing JS class or fake a game entry point. The
result is a force-execution diagnostic, not a completed source link.
"""
from __future__ import annotations
import argparse, json, hashlib, re, shutil, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DEFBASE=ROOT/'factory-output/source-first/force-init-recovery'
FILTERED=ROOT/'factory-output/source-first/fix14-types'
REPORT=ROOT/'reports/fix14/module-recovery.json'

def block(s:str,symbol:str):
    pat=re.compile(r'^export (?:class|function) '+re.escape(symbol)+r'\s*(?:\(|\{)',re.M)
    match=pat.search(s)
    if not match:return None
    pos=s.index('{',match.start());depth=0;quote=None;escape=False;line_comment=False;block_comment=False
    for i in range(pos,len(s)):
        c=s[i];nextc=s[i+1] if i+1<len(s) else ''
        if line_comment:
            if c=='\n':line_comment=False
            continue
        if block_comment:
            if c=='*' and nextc=='/':block_comment=False
            continue
        if quote:
            if escape:escape=False
            elif c=='\\':escape=True
            elif c==quote:quote=None
            continue
        if c=='/' and nextc=='/':line_comment=True;continue
        if c=='/' and nextc=='*':block_comment=True;continue
        if c in "'\"`":quote=c;continue
        if c=='{':depth+=1
        elif c=='}':
            depth-=1
            if depth==0:return s[match.start():i+1]
    return None

def initializer_line(s:str,name:str):
    m=re.search(r'^export (?:let|const) '+re.escape(name)+r'\s*=\s*[^;\n]+;',s,re.M)
    return m.group() if m else None

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path,default=DEFBASE);ap.add_argument('--focused',type=Path,default=FILTERED);ap.add_argument('--output',type=Path,default=ROOT/'factory-output/source-first/force-recovered');arg=ap.parse_args()
    if arg.output.resolve()==arg.source.resolve():raise ValueError('do not modify verified baseline in place')
    shutil.copytree(arg.source,arg.output,dirs_exist_ok=True)
    failures=json.loads((ROOT/'reports/fix14/original-failures.json').read_text())['failedModules']
    results=[]
    for entry in failures:
        rel=Path(entry['module'])
        symbol=re.search(r'ReferenceError: ([A-Za-z_$][\w$]*) is not defined',entry['error'])
        if not symbol:continue
        symbol=symbol.group(1)
        source=arg.source/rel;target=arg.output/rel;focus=arg.focused/rel
        state={'module':rel.as_posix(),'original_failure':symbol,'outcome':'not recovered'}
        if not focus.is_file():state['reason']='no exact filtered source';results.append(state);continue
        manifest=focus.with_name(focus.name.removesuffix('.mjs')+'.manifest.json')
        entries=json.loads(manifest.read_text())['definitions']
        cls=next((v for v in entries if v['name']==symbol and v['status']=='source-first'
                  and v['kind']=='CXXRecordDecl' and
                  (v.get('header_record_factory') or v.get('physical_source'))),None)
        if not cls:
            # A typedef-owned anonymous C POD has no JavaScript class and
            # MUST NOT be repaired by fabricating one. Instead, an exact
            # original-source VarDecl may be re-lowered as a Clang-proven
            # zero aggregate, preserving its fixed-width typed array members.
            original=source.read_text();code_focus=focus.read_text()
            replacements=[]
            for row in entries:
                if row['status']!='source-first' or row['kind']!='VarDecl':continue
                name=row['name']
                old=initializer_line(original,name);new=initializer_line(code_focus,name)
                if (old and new and old!=new and
                    ('= cZeroAggregate(' in new or '= cInitByteRecord(' in new) and
                    'new '+symbol+'(' in old):
                    replacements.append((old,new))
            if not replacements or 'cZeroAggregate =' not in original:
                state['reason']='no Clang-proven emitted record definition';results.append(state);continue
            modified=original
            for old,new in replacements:modified=modified.replace(old,new,1)
            candidate=target.with_name('.'+target.name+'.candidate.mjs')
            candidate.write_text(modified)
            check=subprocess.run(['node','--input-type=module','-e',
                   'import('+json.dumps(candidate.as_uri())+').then(m=>console.log("loaded",Object.keys(m).length)).catch(e=>{console.error(String(e));process.exitCode=2})'],capture_output=True,text=True,timeout=15)
            if check.returncode:
                candidate.unlink();state['reason']='verified aggregate evaluation failed: '+check.stderr[-200:]
                results.append(state);continue
            candidate.replace(target)
            state.update(outcome='loaded in Node',recovered_aggregate=[x[1].split('=')[0].strip() for x in replacements],
                    proof='Clang original aggregate initializer, compiler-generated',
                    semantic_verified=False)
            results.append(state);continue
        code=block(focus.read_text(),symbol)
        if not code:
            state['reason']='missing full original record factory body';results.append(state);continue
        original=source.read_text();needle=re.search(r'^// C/C\+\+ source:',original,re.M)
        if not needle:
            state['reason']='original source boundaries unavailable';results.append(state);continue
        modified=original[:needle.start()]+code+'\n\n'+original[needle.start():]
        # Use the AST-selected original initializer if class is a memoizing
        # source factory. An ES class and a constructor-returning function
        # have different JS new-expression semantics.
        if cls.get('header_record_factory'):
            consumers=[v for v in entries if v['kind']=='VarDecl' and v['status']=='source-first']
            for var in consumers:
                name=var['name'];old=initializer_line(modified,name);fresh=initializer_line(focus.read_text(),name)
                if old and fresh and old!=fresh:
                    modified=modified.replace(old,fresh,1)
        if modified==original:
            state['reason']='no generated changes';results.append(state);continue
        temp=target.with_name('.'+target.name+'.candidate.mjs')
        temp.write_text(modified)
        # Static import of original compiled code in Node is a real module
        # initialization test. Syntax-only success is insufficient.
        check=subprocess.run(['node','--check',str(temp)],capture_output=True,text=True,timeout=12)
        if check.returncode:
            state['reason']='syntax: '+check.stderr[-250:];temp.unlink();results.append(state);continue
        sample=subprocess.run(['node','--input-type=module','-e',
               'import('+json.dumps(temp.as_uri())+').then(m=>{console.log("loaded",Object.keys(m).length)}).catch(e=>{console.error(String(e));process.exitCode=2})'],capture_output=True,text=True,timeout=15)
        # A successful first constructor may uncover another *source-defined*
        # constructor. Query an independently Clang-emitted closure from the
        # same original source unit; never create an arbitrary JS placeholder.
        extra_providers=[]
        for _ in range(6):
            if not sample.returncode:break
            missing=re.search(r'ReferenceError: ([A-Za-z_$][\w$]*) is not defined',sample.stderr or sample.stdout)
            if not missing:break
            dependency=missing.group(1)
            provider=ROOT/'factory-output/source-first/fix14-extra'/rel
            if not provider.is_file():break
            provider_manifest=provider.with_name(provider.name.removesuffix('.mjs')+'.manifest.json')
            defs=json.loads(provider_manifest.read_text())['definitions']
            evidence=next((d for d in defs if d['name']==dependency and d['status']=='source-first'
                and d['kind']=='CXXRecordDecl' and d.get('physical_source')),None)
            source_code=block(provider.read_text(),dependency) if evidence else None
            if not source_code or dependency in extra_providers:break
            current=temp.read_text()
            boundary=re.search(r'^// C/C\+\+ source:',current,re.M)
            if not boundary:break
            temp.write_text(current[:boundary.start()]+source_code+'\n\n'+current[boundary.start():])
            extra_providers.append(dependency)
            sample=subprocess.run(['node','--input-type=module','-e',
               'import('+json.dumps(temp.as_uri()+'?closure='+str(len(extra_providers)))+').then(m=>{console.log("loaded",Object.keys(m).length)}).catch(e=>{console.error(String(e));process.exitCode=2})'],capture_output=True,text=True,timeout=15)
        if sample.returncode:
            state['reason']='node initialization: '+(sample.stderr or sample.stdout)[-300:].strip();temp.unlink();results.append(state);continue
        modified=temp.read_text()
        temp.replace(target)
        if extra_providers:state['additional_source_classes']=extra_providers
        state.update(outcome='loaded in Node',original_source=cls.get('physical_source'),
                     source_proof=cls.get('odr_inline',{}).get('semantic_sha256'),
                     emitted_class=symbol,node_output=sample.stdout.strip(),sha256=hashlib.sha256(modified.encode()).hexdigest(),
                     semantic_verified=False)
        results.append(state)
    record={'format':'eduke32-source-initializer-recovery/1',
            'original_report_failures':len(failures), 'node_module_recoveries':sum(x['outcome']=='loaded in Node' for x in results),
            'results':results,'original_gameplay_verified':False}
    REPORT.parent.mkdir(parents=True,exist_ok=True);REPORT.write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
    return record

if __name__=='__main__':main()
