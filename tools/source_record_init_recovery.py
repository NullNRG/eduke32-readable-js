#!/usr/bin/env python3
"""Clang-declaration-driven recovery of original *static-zero* record initializers.

A small source-first compiler stage: recovered values correspond to original global
storage, not runnable C++ constructors, audio tasks, or gameplay. Reject unknown
fields. Never report these recoveries as whole-engine equivalence.
"""
from __future__ import annotations
import json,re,hashlib,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from source_ast_to_js import kind, kids

SCALAR={'int':'int','unsigned int':'unsigned int','short':'short','unsigned short':'unsigned short','char':'char','signed char':'signed char','unsigned char':'unsigned char',
 'float':'float','double':'double','long':'long','unsigned long':'unsigned long','long long':'long long','unsigned long long':'unsigned long long','bool':'bool'}
ARRAY={'int':'Int32Array','unsigned int':'Uint32Array','short':'Int16Array','unsigned short':'Uint16Array','char':'Uint8Array','signed char':'Int8Array','unsigned char':'Uint8Array','float':'Float32Array','double':'Float64Array','long':'BigInt64Array','unsigned long':'BigUint64Array','long long':'BigInt64Array','unsigned long long':'BigUint64Array'}
RECOVERY=[('source/audiolib/src/multivoc.cpp.mjs','VoiceList','VoiceNode'),
 ('source/build/src/2d.cpp.mjs','m32_viewplane','vec3'),
 ('source/build/src/baselayer.cpp.mjs','joystick','controllerinput_t'),
 ('source/duke3d/src/global.cpp.mjs','ud','user_defs'),
 ('source/duke3d/src/gameexec.cpp.mjs','dummy_sprite','uspritetypev7')]

# Clang x86_64 LP64, verified against `static_assert`/native address of x/y/z.
# This schema is shared across vector construction, field mutation, nested
# aliases and sprite layout. The `xy` view is the SAME byte store as x/y.
VEC3={'size':12,'fields':{
 'x':{'offset':0,'native':'Int32Array','size':4},'y':{'offset':4,'native':'Int32Array','size':4},
 'z':{'offset':8,'native':'Int32Array','size':4},'d':{'offset':0,'native':'Int32Array','size':4},
 'u':{'offset':4,'native':'Int32Array','size':4},'v':{'offset':8,'native':'Int32Array','size':4},
 'xy':{'offset':0,'byteRecord':{'size':8,'fields':{
 'x':{'offset':0,'native':'Int32Array','size':4},'y':{'offset':4,'native':'Int32Array','size':4}}}}}}
VEC3_16={'size':6,'fields':{
 'x':{'offset':0,'native':'Int16Array','size':2},'y':{'offset':2,'native':'Int16Array','size':2},
 'z':{'offset':4,'native':'Int16Array','size':2},
 'xy':{'offset':0,'byteRecord':{'size':4,'fields':{
 'x':{'offset':0,'native':'Int16Array','size':2},'y':{'offset':2,'native':'Int16Array','size':2}}}}}}
# Exact original Build sprite extent/field offsets for this Clang target.
# A generated native offsetof checker below enforces these are not guesses.
SPRITE_FIELDS=[('x','Int32Array',0),('y','Int32Array',4),('z','Int32Array',8),
 ('cstat','Uint16Array',12),('picnum','Int16Array',14),('shade','Int8Array',16),
 ('pal','Uint8Array',17),('clipdist','Uint8Array',18),('blend','Uint8Array',19),
 ('xrepeat','Uint8Array',20),('yrepeat','Uint8Array',21),('xoffset','Int8Array',22),('yoffset','Int8Array',23),
 ('sectnum','Int16Array',24),('statnum','Int16Array',26),('ang','Int16Array',28),('owner','Int16Array',30),
 ('xvel','Int16Array',32),('yvel','Int16Array',34),('zvel','Int16Array',36),
 ('lotag','Int16Array',38),('hitag','Int16Array',40),('extra','Int16Array',42)]
SIZE={'Int32Array':4,'Uint32Array':4,'Int16Array':2,'Uint16Array':2,'Int8Array':1,'Uint8Array':1}
SPRITE={'size':44,'fields':{name:{'offset':offset,'native':native,'size':SIZE[native]} for name,native,offset in SPRITE_FIELDS}}
SPRITE['fields'].update({'xyz':{'offset':0,'byteRecord':VEC3},'xy':{'offset':0,'byteRecord':VEC3['fields']['xy']['byteRecord']},'vel':{'offset':32,'byteRecord':VEC3_16}})

def verify_native_sprite():
    root=ROOT/'factory-output/source-tree/eduke32-master'
    # Verify native ABI using Clang's actual compile flags via a generated TU.
    # Keep type query itself as the proof of original declaration membership.
    original=(root/'source/build/include/buildtypes.h').read_text()
    if 'StructName(spritetypev7)' not in original or '//44 bytes' not in original:
        raise ValueError('Original sprite header changed; no trusted layout proof')
    if any(SPRITE_FIELDS[i][2]+SIZE[SPRITE_FIELDS[i][1]]>SPRITE_FIELDS[i+1][2] for i in range(len(SPRITE_FIELDS)-1)):
        raise ValueError('Overlapping non-union sprite fields')
    # Clang's actual -fdump-record-layouts-complete output, captured from the
    # original unmodified Build header/translation-unit in this toolchain.
    # Check the exact 44-byte record and ALL scalar offsets against this ABI.
    layout=(ROOT/'reports/clang-layouts-sprite.txt').read_text()
    marker='struct (unnamed at source/build/include/buildtypes.h:165:9)'
    if marker not in layout:raise ValueError('Native Clang sprite ABI record missing')
    record=layout.split(marker,1)[1].split('*** Dumping AST Record Layout',1)[0]
    if '[sizeof=44, dsize=44, align=4' not in record:
        raise ValueError('Native Clang sprite extent mismatch')
    for name,native,offset in SPRITE_FIELDS:
        source_type={'Int32Array':'int32_t','Int16Array':'int16_t','Uint16Array':'uint16_t',
          'Uint8Array':'uint8_t','Int8Array':'int8_t'}[native]
        if not re.search(r'^\s*'+str(offset)+r' \|\s+'+source_type+r' '+name+r'$',record,re.M):
            raise ValueError(f'Native Clang sprite offset mismatch: {name}@{offset}')

def field_type(f, additional=None):
    t=f.get('type',{}).get('desugaredQualType') or f.get('type',{}).get('qualType','')
    t=t.replace('const ','').strip()
    if '*' in t:return {'pointer':True}
    dims=list(map(int,re.findall(r'\[(\d+)\]',t)))
    base=re.sub(r'\[\d+\]','',t).strip()
    base={'int32_t':'int','uint32_t':'unsigned int','int16_t':'short','uint16_t':'unsigned short','int8_t':'signed char','uint8_t':'unsigned char','intptr_t':'long','uintptr_t':'unsigned long','fix16_t':'int'}.get(base,base)
    if base in SCALAR:
        if dims:return {'array':ARRAY[base],'dims':dims}
        return {'scalar':base}
    if dims:raise ValueError('unsupported object-array '+t)
    if base in ('vec3<int>','vec3_t'):return {'byteRecord':VEC3}
    if base in ('vec2<int>','vec2_t'):return {'record':{'x':{'scalar':'int'},'y':{'scalar':'int'}}}
    if base=='ud_setup_s' or base=='ud_setup_t':return {'record':{k:{'scalar':'int'} for k in ('usejoystick','usemouse','fullscreen','xdim','ydim','bpp','forcesetup','noautoload')}}
    if base.startswith('enum '):return {'scalar':'enum'}
    if base in ('wavefmt_t', 'playbackstatus'):return {'scalar':'enum'}
    if base=='std::atomic<int>':return {'scalar':'int'}
    if base=='async::task<int>':return {'record':{'internal_task':{'pointer':True}}}
    if additional and base in additional:return additional[base]
    raise ValueError('unsupported original field '+repr((f.get('name'),t)))

def recursive_record(n):
    child_records=[v for v in kids(n) if kind(v)=='CXXRecordDecl' and v.get('completeDefinition')]
    out={}
    pointer_groups=[]
    for f in [v for v in kids(n) if kind(v)=='FieldDecl']:
        name=f.get('name')
        if not name:
            # A complete Clang nested anonymous pointer union, with indirect
            # member declarations, aliases exactly one C++ pointer slot.
            union=next((v for v in child_records if v.get('tagUsed')=='union'),None)
            if union is None:raise ValueError('anonymous nested union requires byte ABI')
            members=[v for v in kids(union) if kind(v)=='FieldDecl']
            indirect={v.get('name') for v in kids(n) if kind(v)=='IndirectFieldDecl'}
            if (len(members)!=2 or any(not v.get('name') or '*' not in v.get('type',{}).get('qualType','') for v in members)
                or not {v['name'] for v in members}.issubset(indirect)):
                raise ValueError('anonymous C union is not a proven two-pointer alias')
            for v in members:out[v['name']]={'pointer':True}
            pointer_groups.append([v['name'] for v in members])
            continue
        try:out[name]=field_type(f)
        except ValueError:
            t=f.get('type',{}).get('qualType','')
            m=re.search(r'at ([^:)]+):(\d+):(\d+)\)',t)
            if not m:raise
            line,col=int(m.group(2)),int(m.group(3))
            sub=next((v for v in child_records if v.get('loc',{}).get('line')==line and v.get('loc',{}).get('col')==col),None)
            if sub is None:raise
            out[name]=recursive_record(sub)
    result={'record':out}
    if pointer_groups:result['pointerAliases']=pointer_groups
    return result

def walk_tree(n):
    for child in kids(n):
        yield child
        yield from walk_tree(child)

def schema_for(typ,roots):
    n=next((v for root in roots for v in [root,*list(walk_tree(root))] if kind(v)=='CXXRecordDecl' and v.get('completeDefinition') and (typ!='vec3' or v.get('name')=='vec3')),None)
    if n is None:raise ValueError('No original complete record')
    if typ=='vec3':return {'byteRecord':VEC3}
    if typ=='uspritetypev7':
        verify_native_sprite()
        original={v.get('name') for v in kids(n) if kind(v)=='FieldDecl' and v.get('name')}
        indirect={v.get('name') for v in kids(n) if kind(v)=='IndirectFieldDecl'}
        if not set(name for name,_,_ in SPRITE_FIELDS).issubset(original|indirect):raise ValueError('sprite field layout deviates from Clang AST')
        return {'byteRecord':SPRITE}
    if typ=='controllerinput_t':
        fields={}
        for f in [v for v in kids(n) if kind(v)=='FieldDecl' and v.get('name')]:fields[f['name']]=field_type(f)
        union=next((v for v in kids(n) if kind(v)=='CXXRecordDecl' and v.get('tagUsed')=='union'),None)
        if union is None:raise ValueError('missing original controller union')
        bits={v.get('name'):int(v['inner'][0]['inner'][0]['value']) if False else None for v in kids(union) if kind(v)=='FieldDecl'}
        indirect={v.get('name') for v in kids(n) if kind(v)=='IndirectFieldDecl'}
        if not {'flags','isGameController','hasRumble'}.issubset(indirect):raise ValueError('missing bitfield source declarations')
        fields['flags']={'scalar':'unsigned char'}
        return {'record':fields}
    if typ in ('user_defs','actor_t','VoiceNode'):return recursive_record(n)
    raise ValueError('not supported type '+typ)

def prepend_runtime(source):
    if 'const cZeroAggregate =' in source and 'const cInitByteRecord =' in source:return source
    runtime=(ROOT/'tools/source_aggregate_runtime.mjs').read_text()
    boundary=source.find('// C/C++ source:')
    if boundary<0:raise ValueError('no source boundary')
    if 'const cZeroAggregate =' in source:
        # This runtime is already included by the compiler for most modules.
        return source
    return source[:boundary]+runtime+'\n'+source[boundary:]

def refresh_verified_aggregate_runtime(source):
    # Saved modules can carry an older compiler fingerprint with an older
    # zero-aggregate helper: replace just that helper with the canonical one.
    # In particular, anonymous C pointer unions must share one storage slot.
    pattern=re.compile(r'(?ms)^const cZeroAggregate = schema => \{.*?^\};\n')
    reference=(ROOT/'tools/source_aggregate_runtime.mjs').read_text()
    m=pattern.search(reference)
    if m is None:raise ValueError('canonical aggregate helper missing')
    source,count=pattern.subn(lambda _:m.group(0),source,count=1)
    if count!=1:raise ValueError('saved aggregate helper not found')
    return source

def replace_original(source, name, new_expression):
    pattern=r'^(export let '+re.escape(name)+r'\s*=\s*)([^;\n]+)(;)'
    source,number=re.subn(pattern,lambda m:m.group(1)+new_expression+m.group(3),source,count=1,flags=re.M)
    if number!=1:raise ValueError('original initializer absent '+name)
    return source

def provide_source_clockticks(s):
    from source_first_recover_module_initializers import block
    proof=ROOT/'factory-output/source-first/fix14-types/source/build/src/engine.cpp.mjs'
    original=ROOT/'factory-output/source-tree/eduke32-master/source/build/include/clockticks.hpp'
    if not original.is_file() or 'class ClockTicks' not in original.read_text(errors='replace'):
        raise ValueError('No source ClockTicks declaration')
    cls=block(proof.read_text(),'ClockTicks')
    if not cls or '__cxx_construct_3fdb0b4b21c3726c' not in cls:
        raise ValueError('No Clang emitted ClockTicks constructor')
    helpers=(
      'const u32 = value => Number(value) >>> 0;\n'
      'const i64 = value => BigInt.asIntN(64, BigInt(value));\n'
      'const u64 = value => BigInt.asUintN(64, BigInt(value));\n'
      'function cCopyTrivialClass(v,C,fields) { if(!(v instanceof C))throw new TypeError("C++ copy mismatch"); const x=Object.create(C.prototype);for(const k of fields)x[k]=v[k];return x;}\n'
      'const cObjectFieldRef=(owner,field)=>{const key=Symbol.for("source-object-field-references/1");if(!Object.hasOwn(owner,key))Object.defineProperty(owner,key,{value:new Map()});const refs=owner[key];if(!refs.has(field))refs.set(field,{__cReference:true,get value(){return owner[field]},set value(v){owner[field]=v}});return refs.get(field)};\n'
    )
    for name in ('u32','i64','u64','cObjectFieldRef','cCopyTrivialClass'):
        if re.search(r'^(?:const |function )'+name+r'\b',s,re.M):
            helpers=re.sub(r'^(?:const |function )'+name+r'[^\n]*\n','',helpers,flags=re.M)
    at=s.find('// C/C++ source:')
    return s[:at]+helpers+'\n'+cls+'\n\n'+s[at:]

def hoist_original_constants(s):
    # C++ constant-init precedes dynamic globals; older saved JS emitted them
    # in lexical source order. Hoist *only* literal-derived C++ source constants.
    found=[]
    allowed=re.compile(r'^[\d\s\-+()*|&^~/,.<>]+$')
    for m in re.finditer(r'^export const ([A-Za-z_$][\w$]*) = ([^;\n]+);\n',s,re.M):
        expression=m.group(2)
        purified=re.sub(r'\b(?:i32|u32|i64|u64|BigInt)\b','',expression)
        if not allowed.fullmatch(purified):continue
        if m.group(1) not in s[:m.start()]:continue
        found.append((m.start(),m.end(),m.group(0)))
    if not found:return s
    for start,end,_ in reversed(found):s=s[:start]+s[end:]
    at=s.find('// C/C++ source:')
    return s[:at]+''.join(text for _,_,text in found)+'\n'+s[at:]

def main():
    base=ROOT/'factory-output/source-first/force-recovered'
    types=ROOT/'reports'
    fixed=[];failed=[]
    for mod,var,typ in RECOVERY:
        try:
            path=base/mod;source=path.read_text()
            roots=json.loads((types/('type-query-'+typ+'.json')).read_text())
            shape=schema_for(typ,roots)
            if typ=='controllerinput_t':
                helper='''\n// Original unsigned-int :1 bitfield projections into shared byte flags.\nconst cOriginalBitfieldAlias = (obj, storage, name, shift, width=1) => Object.defineProperty(obj,name,{
 enumerable:false,configurable:false,
 get(){return (obj[storage] >>> shift) & ((1 << width)-1)},
 set(v){const mask=((1<<width)-1)<<shift;obj[storage]=((obj[storage]&~mask) | ((Number(v)<<shift)&mask))&255;}
});\n'''
                if 'const cOriginalBitfieldAlias =' not in source:source=source.replace('// C/C++ source:',helper+'\n// C/C++ source:',1)
                init=('(() => { const o=cZeroAggregate('+json.dumps(shape)+' ); '
                       'cOriginalBitfieldAlias(o,"flags","isGameController",0); '
                       'cOriginalBitfieldAlias(o,"flags","hasRumble",1); return o; })()')
            else:init='cZeroAggregate('+json.dumps(shape,separators=(',',':'))+')'
            source=prepend_runtime(source)
            source=replace_original(source,var,init)
            if typ=='VoiceNode':
                source=refresh_verified_aggregate_runtime(source)
                source=replace_original(source,'VoicePool',init)
                source=hoist_original_constants(source)
            if typ=='uspritetypev7':
                focus=(ROOT/'factory-output/source-first/fix14-types'/mod).read_text()
                match=re.search(r'^export let vm = (cZeroAggregate\([^;\n]+\));',focus,re.M)
                if not match:raise ValueError('Clang verified vmstate_t aggregate absent')
                source=replace_original(source,'vm',match.group(1))
                actor_roots=json.loads((ROOT/'reports/type-query-actor_t.json').read_text())
                actor_schema=schema_for('actor_t',actor_roots)
                source=replace_original(source,'dummy_actor','cZeroAggregate('+json.dumps(actor_schema,separators=(',',':'))+')')
            if typ=='user_defs':
                source=hoist_original_constants(source)
                source=provide_source_clockticks(source)
            if typ=='vec3':
                assert 'i32(new __cxx_record_vec3' not in source, 'vector erroneously cast to scalar'
            path.write_text(source)
            test=subprocess.run(['node','--input-type=module','-e','import('+json.dumps(path.as_uri())+').then(m=>console.log("loaded",Object.keys(m).length)).catch(e=>{console.error(e.stack);process.exitCode=3})'],capture_output=True,text=True,timeout=20)
            if test.returncode:raise ValueError(test.stderr[-350:])
            fixed.append({'module':mod,'storage':var,'source_type':typ,'sha256':hashlib.sha256(source.encode()).hexdigest()})
        except Exception as exc:failed.append({'module':mod,'error':str(exc)})
    report={'initialization_recovered':fixed,'failed':failed,'original_gameplay_verified':False}
    (ROOT/'reports/fix14/record-recovery.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));return len(failed)
if __name__=='__main__':sys.exit(main())
