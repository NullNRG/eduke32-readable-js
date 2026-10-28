"""C byte-search parity across numeric heap addresses and source pointer aliases."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
    assert r.returncode==0,(args,r.stdout[-1500:],r.stderr[-2000:])
    return r.stdout
with tempfile.TemporaryDirectory(prefix='source-host-search-') as td:
    p=Path(td)
    (p/'main.cpp').write_text('''#include <cstdio>
#include <cstring>
int main(){for(int seed=0;seed<256;seed++){
 char b[40]={},n[4]={};int size=1+seed%32;
 for(int i=0;i<size;i++)b[i]=char(1+(seed*13+i*17)%255);
 int start=seed%size;char *h=b+start;
 if(seed%4){n[0]=b[(seed*3)%size];if(seed%3)n[1]=b[(seed*3+1)%size];}
 int c=seed%7?int((unsigned char)b[(seed*5)%size]):0,count=(size-start+1)/2;
 const char *a=strchr(h,c),*r=strrchr(h,c),*s=strstr(h,n),*m=(char*)memchr(h,c,count);
 printf("%td %td %td %td\\n",a?a-h:-1,r?r-h:-1,s?s-h:-1,m?m-h:-1);
}}
''')
    native=p/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14',str(p/'main.cpp'),'-o',str(native)])
    expected=[[int(v) for v in line.split()] for line in run([str(native)]).splitlines()]
    js='''async ({search,abi})=>{
      const [{createCSourceSearch},{ABIHeap}]=await Promise.all([import(search),import(abi)]);
      const heap=new ABIHeap(),c=createCSourceSearch({heap}),rows=[];
      for(let seed=0;seed<256;seed++){
        const size=1+seed%32,buffer=new Uint8Array(size+11),b=buffer.subarray(5,6+size),n=new Uint8Array(4);
        for(let i=0;i<size;i++)b[i]=1+(seed*13+i*17)%255;
        const start=seed%size,base=b.byteOffset+start;
        const h={__cPointer:true,buffer:b.buffer,lower:b.byteOffset,upper:b.byteOffset+b.length,offset:base,array:false};
        if(seed%4){n[0]=b[(seed*3)%size];if(seed%3)n[1]=b[(seed*3+1)%size];}
        const needle=heap.malloc(4);heap.u8.set(n,needle);
        const ch=seed%7?b[(seed*5)%size]:0,count=Math.floor((size-start+1)/2);
        const found=[c.strchr(h,ch),c.strrchr(h,ch),c.strstr(h,needle),c.memchr(h,ch,count)];
        rows.push(found.map(ptr=>ptr===null?-1:ptr.offset-base));
        for(const ptr of found)if(ptr!==null&&(ptr.buffer!==h.buffer||ptr.lower!==h.lower||ptr.upper!==h.upper))throw Error('source allocation identity or bounds changed');
        const numeric=heap.malloc(size-start+1);heap.u8.set(b.subarray(start),numeric);
        const normal=[c.strchr(numeric,ch),c.strrchr(numeric,ch),c.strstr(numeric,n),c.memchr(numeric,ch,count)].map(ptr=>ptr===0?-1:ptr-numeric);
        if(JSON.stringify(normal)!==JSON.stringify(rows.at(-1)))throw Error('mixed source/heap search mismatch');
        heap.free(needle);heap.free(numeric);
      }
      const bytes=new Uint8Array([65,66,0]),alias=c.strchr(bytes,66);
      new Uint8Array(alias.buffer)[alias.offset]=67;if(bytes[1]!==67)throw Error('returned pointer lost mutation alias');
      for(const fn of [()=>c.memchr(bytes,65,4),()=>c.strrchr(new Uint8Array([65]),65)]){
        let rejected=false;try{fn();}catch(error){if(error instanceof RangeError)rejected=true;else throw error;}
        if(!rejected)throw Error('unbounded source read accepted');
      }
      return rows;
    }'''
    urls={'search':(ROOT/'runtime/c_source_search.mjs').as_uri(),'abi':(ROOT/'runtime/abi.mjs').as_uri()}
    (p/'check.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(urls)+')));')
    assert json.loads(run(['node',str(p/'check.mjs')]))==expected
    report={'passed':True,'native_node_cases':256,'mixed_heap_source_cases':256,'bounds_and_mutation_alias_verified':True,'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        data=lambda s:'data:text/javascript;base64,'+base64.b64encode(s.encode()).decode()
        source=(ROOT/'runtime/c_source_search.mjs').read_text().replace("'./source_bytes.mjs'",json.dumps(data((ROOT/'runtime/source_bytes.mjs').read_text())))
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            actual=page.evaluate(js,{'search':data(source),'abi':data((ROOT/'runtime/abi.mjs').read_text())})
            assert actual==expected and not errors,(actual[:5],errors)
            report.update(chromium_cases=256,browser_version=browser.version);browser.close()
    (ROOT/'reports/oct24-source-search-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
