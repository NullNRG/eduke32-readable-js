"""Original source-pointer integer conversion versus native 64-bit C parsing."""
import base64,json,os,subprocess,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def run(args):
    result=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
    assert result.returncode==0,(args,result.stdout[-1500:],result.stderr[-2000:])
    return result.stdout

with tempfile.TemporaryDirectory(prefix='source-integer-boundary-') as directory:
    folder=Path(directory)
    # The Windows native CRT differs from the source LP64/glibc target for
    # malformed 0x prefixes. Keep those in explicit target-semantics checks
    # below, never normalize a discrepant native result into a claimed pass.
    limits=['','+','-','  -0x1F tail','0x1','0b101','-0','0779',
        '9223372036854775807','9223372036854775808','-9223372036854775808',
        '-9223372036854775809','18446744073709551615','18446744073709551616',
        '-18446744073709551615','-18446744073709551616',' \t\n42xyz','zzz','12e3']
    cases=[]
    for index in range(512):
        text=limits[index%len(limits)] if index<256 else str((index-384)*7919)+' tail'
        cases.append({'text':text,'base':[0,2,8,10,16,36][index%6],'unsigned':bool(index%2)})
    initializers=',\n'.join('{'+json.dumps(row['text'])+','+str(row['base'])+','+str(int(row['unsigned']))+'}' for row in cases)
    source='''#include <cstdio>
#include <cstdlib>
#include <cerrno>
struct Test {const char *text;int base;bool unsign;};
Test tests[]={'''+initializers+'''};
int main(){for(auto test:tests){char *end=nullptr;errno=7;
 if(test.unsign){unsigned long long value=strtoull(test.text,&end,test.base);
  printf("%llu %td %d\\n",value,end-test.text,errno);}
 else{long long value=strtoll(test.text,&end,test.base);
  printf("%lld %td %d\\n",value,end-test.text,errno);}
}}
'''
    (folder/'oracle.cpp').write_text(source)
    exe=folder/('oracle.exe' if os.name=='nt' else 'oracle')
    run(['clang++','-std=c++14',str(folder/'oracle.cpp'),'-o',str(exe)])
    expected=[[parts[0],int(parts[1]),int(parts[2])] for line in run([str(exe)]).splitlines() if (parts:=line.split())]
    js='''async ({parser,abi,cases})=>{
      const [{createCIntegerParse},{ABIHeap}]=await Promise.all([import(parser),import(abi)]);
      const heap=new ABIHeap(),error=heap.malloc(4),endAddress=heap.malloc(8);
      const library=createCIntegerParse({heap,errnoLocation:()=>error}),rows=[];
      for(const test of cases){
        const encoded=new TextEncoder().encode(test.text),backing=new Uint8Array(encoded.length+13);
        const bytes=backing.subarray(5,6+encoded.length);bytes.set(encoded);
        const pointer={__cPointer:true,buffer:bytes.buffer,lower:bytes.byteOffset,
          upper:bytes.byteOffset+bytes.length,offset:bytes.byteOffset,array:false};
        const end={__cReference:true,value:null};heap.write(error,'i32',7);
        const name=test.unsigned?'strtoul':'strtol',value=library[name](pointer,end,test.base);
        if(end.value.buffer!==pointer.buffer||end.value.lower!==pointer.lower||end.value.upper!==pointer.upper)
          throw Error('Parser changed original source pointer identity or bounds');
        const row=[String(value),end.value.offset-pointer.offset,heap.read(error,'i32')];rows.push(row);
        const numeric=heap.writeCString(test.text);heap.write(error,'i32',7);
        const numericValue=library[name](numeric,endAddress,test.base);
        const nativeRow=[String(numericValue),Number(heap.read(endAddress,'u64'))-numeric,heap.read(error,'i32')];
        if(JSON.stringify(row)!==JSON.stringify(nativeRow))throw Error('Heap/source integer semantics diverged');
        const deferred={__cDeferredPointer:true,resolve:()=>pointer};
        heap.write(error,'i32',7);const deferredEnd={__cReference:true,value:null};
        if(library[name](deferred,deferredEnd,test.base)!==value)throw Error('Deferred source mismatch');
        heap.free(numeric);
        new Uint8Array(end.value.buffer)[end.value.offset]=88;
        if(bytes[row[1]]!==88)throw Error('Returned end pointer detached source storage');
      }
      const binary=new Uint8Array([48,98,49,48,49,120,0]),end={__cReference:true,value:null};
      if(library.__isoc23_strtoul(binary,end,0)!==5n||end.value.offset!==5)throw Error('C23 binary prefix lost');
      if(library.strtoul(binary,end,0)!==0n||end.value.offset!==1)throw Error('Legacy binary behavior changed');
      const malformed=new Uint8Array([48,120,0]);
      if(library.strtol(malformed,end,0)!==0n||end.value.offset!==1)throw Error('LP64/glibc malformed hex prefix changed');
      for(const call of [()=>library.strtol(new Uint8Array([49]),null,10),
          ()=>library.strtol(binary,endAddress,10)]){
        let rejected=false;try{call();}catch(error){rejected=error instanceof TypeError||error instanceof RangeError;}
        if(!rejected)throw Error('Unproven source memory accepted');
      }
      return rows;
    }'''
    urls={'parser':(ROOT/'runtime/c_integer_parse.mjs').as_uri(),'abi':(ROOT/'runtime/abi.mjs').as_uri(),'cases':cases}
    (folder/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(urls)+')));')
    actual=json.loads(run(['node',str(folder/'check.mjs')]))
    assert actual==expected,[(index,a,b) for index,(a,b) in enumerate(zip(actual,expected)) if a!=b][:10]
    report={'passed':True,'native_node_cases':512,'heap_source_deferred_cases':512,
        'end_pointer_identity_bounds_and_mutation_verified':True,'gameplay_verified':False,
        'oracle':'Native strtoll/strtoull supplies 64-bit integer width on Windows LLP64',
        'target_only_checks':['C23 binary prefix','legacy binary prefix','glibc malformed hex prefix'],
        'native_oracle_limitation':'Malformed hex prefixes differ in Windows CRT; no native parity claimed for that case'}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        data=lambda value:'data:text/javascript;base64,'+base64.b64encode(value.encode()).decode()
        source=(ROOT/'runtime/c_integer_parse.mjs').read_text().replace("'./source_bytes.mjs'",json.dumps(data((ROOT/'runtime/source_bytes.mjs').read_text())))
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            actual=page.evaluate(js,{'parser':data(source),'abi':data((ROOT/'runtime/abi.mjs').read_text()),'cases':cases})
            assert actual==expected and not errors,(actual[:5],errors)
            report.update(chromium_cases=512,browser_version=browser.version);browser.close()
    (ROOT/'reports/oct25-source-integer-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
