#!/usr/bin/env python3
"""Convert unconditionally defined literal C preprocessor macros into safe ES constants.

Headers with declarations/types/inline code are indexed but NOT claimed as
transpiled. Conditionals, expressions, pointers and platform-dependent macros
are deliberately excluded from automatic JS exports.
"""
import argparse,json,pathlib,re
HEADER={'.h','.hh','.hpp','.hxx','.inl'}
MACRO=re.compile(r'^\s*#\s*define\s+([A-Za-z_]\w*)\s+(-?(?:0[xX][\da-fA-F]+|\d+)(?:[uUlL]{0,3}))\s*(?:(?://|/\*).*)?$')
CONDITIONAL=re.compile(r'^\s*#\s*(if|ifdef|ifndef|elif|else|endif)\b')
NUMERIC=re.compile(r'^(-?)(0[xX][\da-fA-F]+|\d+)([uUlL]*)$')
JS_IDENT=re.compile(r'^[A-Za-z_$][\w$]*$')
KEYWORDS={'default','class','const','return','switch','function','var','let','export','import','new','delete','if','else','while','for','break','continue','try','catch','throw','await','yield','true','false','null','this'}

def analyze(root,out):
    records=[];defs={};blocked=[]
    for file in sorted(root.rglob('*')):
        if not file.is_file() or file.suffix.lower() not in HEADER:continue
        rel=file.relative_to(root).as_posix();stack=0;count=0;conditional=0;expressions=0
        for n,line in enumerate(file.read_text(errors='replace').splitlines(),1):
            directive=CONDITIONAL.match(line)
            if directive:
                if directive[1] in ('if','ifdef','ifndef'):stack+=1
                elif directive[1]=='endif':stack=max(0,stack-1)
                continue
            if not line.lstrip().startswith('#define ' ) and not re.match(r'^\s*#\s*define ',line):continue
            match=MACRO.match(line)
            if not match:
                expressions+=1;continue
            name,raw=match.groups()
            if stack:
                conditional+=1;continue
            num=NUMERIC.fullmatch(raw)
            if not num or not JS_IDENT.match(name) or name in KEYWORDS:continue
            sign,value,suffix=num.groups()
            if value.lower().startswith('0x'):
                parsed=int(value,16)
            elif len(value)>1 and value[0]=='0':
                if not re.fullmatch(r'0[0-7]+',value):
                    blocked.append({'name':name,'file':rel,'reason':'ambiguous/invalid C octal literal'});continue
                parsed=int(value,8)
            else:
                parsed=int(value,10)
            if sign:parsed=-parsed
            if abs(parsed)>2**53-1:
                blocked.append({'name':name,'file':rel,'reason':'precision exceeds safe JS integer'});continue
            entry={'name':name,'value':parsed,'file':rel,'line':n,'kind':'integer_literal'}
            defs.setdefault(name,[]).append(entry);count+=1
        records.append({'path':rel,'safe_macro_occurrences':count,'conditional_numeric_skipped':conditional,'nonliteral_or_function_macros':expressions,'full_header_transpiled':False})
    constants={};conflicts=[]
    for name,entries in sorted(defs.items()):
        values={x['value'] for x in entries}
        if len(values)>1:
            conflicts.append({'name':name,'values':sorted(values)});continue
        constants[name]=entries[0]['value']
    src=['/** Generated safe, unconditional numeric C-header macros only.',
         ' * Does NOT include conditional macros, C declarations or inline code. */']
    for name,value in constants.items():src.append(f'export const {name} = {value};')
    out.mkdir(parents=True,exist_ok=True)
    (out/'header-constants.mjs').write_text('\n'.join(src)+'\n')
    report={'headers_indexed':len(records),'numeric_macro_occurrences':sum(r['safe_macro_occurrences'] for r in records),
            'safe_js_constants':len(constants),'conflicting_definitions_skipped':conflicts[:250],
            'lossy_or_conditional_skipped':blocked[:250],
            'header_code_fully_transpiled':False,'headers':records}
    (out/'header-audit.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k not in ('headers','conflicting_definitions_skipped','lossy_or_conditional_skipped')},indent=2))
    return report
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True)
    a=p.parse_args();analyze(a.source,a.out)
