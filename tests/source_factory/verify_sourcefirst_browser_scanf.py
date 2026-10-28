"""Compile real C sscanf callers and compare their source storage to native C."""
import base64,json,os,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def run(args):
    r=subprocess.run(args,cwd=ROOT,capture_output=True,text=True,timeout=90)
    assert r.returncode==0,(args,r.stdout[-1800:],r.stderr[-2200:])
    return r.stdout
with tempfile.TemporaryDirectory(prefix='source-scanf-') as directory:
    p=Path(directory)
    inputs=[]
    for i in range(256):
        text=f' {(i-128)/8:.3f}\t{(127-i)/16:.4f} {"0x"+format(i,"x") if i%2 else str(i)} {i*7919} word{i} remainder'
        if i%17==0:text='invalid'
        elif i%19==0:text=f'{i/8} invalid'
        elif i%23==0:text=' \t\n'
        inputs.append(text)
    code='''extern "C" int sscanf(const char *,const char *,...);
extern "C" void scan_fields(const char *text,int *out){
 float f=-2;double d=-3;int v=-77,n=-1;unsigned u=99;char word[9]={};
 int r=sscanf(text,"%f %lf %i %u %8s%n",&f,&d,&v,&u,word,&n);
 out[0]=r;out[1]=(int)(f*16);out[2]=(int)(d*16);out[3]=v;
 out[4]=(int)u;out[5]=n;out[6]=0;
 for(int i=0;i<9;i++)out[6]+=(unsigned char)word[i];
}
'''
    (p/'unit.cpp').write_text(code)
    (p/'main.cpp').write_text('#include <cstdio>\nextern "C" void scan_fields(const char *,int*);\nconst char *inputs[]={'+','.join(map(json.dumps,inputs))+'};\nint main(){for(auto input:inputs){int out[7];scan_fields(input,out);for(int v:out)printf("%d ",v);puts("");}}\n')
    exe=p/('native.exe' if os.name=='nt' else 'native')
    run(['clang++','-std=c++14',str(p/'unit.cpp'),str(p/'main.cpp'),'-o',str(exe)])
    expected=[[int(v) for v in line.split()] for line in run([str(exe)]).splitlines()]
    host='import {createCScanf} from '+json.dumps((ROOT/'runtime/c_scanf.mjs').as_uri())+';\nimport {ABIHeap} from '+json.dumps((ROOT/'runtime/abi.mjs').as_uri())+';\nexport const sscanf=createCScanf({heap:new ABIHeap()}).sscanf;\n'
    (p/'scan-host.mjs').write_text(host)
    (p/'symbols.json').write_text(json.dumps({'sscanf':'scan-host'}))
    run([sys.executable,'tools/source_ast_to_js.py','--root',str(p),'--source','unit.cpp',
         '--out-dir',str(p/'out'),'--filter','scan_fields','--project-symbols',str(p/'symbols.json'),'--import-root',str(p)])
    module=p/'out/unit.cpp.mjs'
    doc=json.loads(module.with_suffix('.manifest.json').read_text())
    assert next(row for row in doc['definitions'] if row['name']=='scan_fields')['status']=='source-first',doc
    js='''async ({module,inputs,scanner,abi})=>{
      const m=await import(module),rows=[];
      for(const input of inputs){const data=new TextEncoder().encode(input+'\\0'),out=new Int32Array(7);
        m.scan_fields(data,out);rows.push(Array.from(out));}
      const [{createCScanf},{ABIHeap}]=await Promise.all([import(scanner),import(abi)]);
      const heap=new ABIHeap(),scan=createCScanf({heap}),bytes=s=>new TextEncoder().encode(s+'\\0');
      const v={__cReference:true,value:0},n={__cReference:true,value:0},unsigned={__cReference:true,value:0};
      if(scan.sscanf(bytes('-7 -1'),bytes('%hhd %u%n'),v,unsigned,n)!==2||v.value!==-7||unsigned.value!==4294967295||n.value!==5)throw Error('Scalar signedness or count failed');
      if(scan.sscanf(bytes('0b11'),bytes('%i%n'),v,n)!==1||v.value!==0||n.value!==1)throw Error('Legacy scanning prefix changed');
      if(scan.__isoc23_sscanf(bytes('0b11'),bytes('%i%n'),v,n)!==1||v.value!==3||n.value!==4)throw Error('C23 scanning prefix failed');
      const backing=new Uint8Array(20),out=backing.subarray(3,7);
      if(scan.sscanf(new Uint8Array([128,255,65,0]),bytes('%3s'),out)!==1||out[0]!==128||out[1]!==255||out[2]!==65||out[3]!==0)throw Error('Byte output was UTF-8 recoded');
      const f=new Float32Array(1),d=new Float64Array(1);
      if(scan.sscanf(bytes('1.25 -3.5'),bytes('%f %lf'),f,d)!==2||f[0]!==1.25||d[0]!==-3.5)throw Error('Borrowed numeric output failed');
      const numeric=heap.writeCString('2.5 7'),fmt=heap.writeCString('%f %d'),a=heap.malloc(4),b=heap.malloc(4);
      if(scan.sscanf(numeric,fmt,a,b)!==2||heap.read(a,'f32')!==2.5||heap.read(b,'i32')!==7)throw Error('Numeric heap compatibility failed');
      for(const call of [()=>scan.sscanf(bytes('longer'),bytes('%s'),new Uint8Array(2)),
          ()=>scan.sscanf(bytes('1.25'),bytes('%f'),new Uint8Array(3)),
          ()=>scan.sscanf(bytes('1.25'),bytes('%Lf'),d),
          ()=>scan.sscanf(bytes('wide'),bytes('%ls'),backing)]){
        let rejected=false;try{call();}catch(error){rejected=error instanceof TypeError||error instanceof RangeError;}
        if(!rejected)throw Error('Unproven scanning storage accepted');
      }
      return rows;
    }'''
    urls={'module':module.as_uri(),'inputs':inputs,'scanner':(ROOT/'runtime/c_scanf.mjs').as_uri(),'abi':(ROOT/'runtime/abi.mjs').as_uri()}
    (p/'run.mjs').write_text('console.log(JSON.stringify(await ('+js+')('+json.dumps(urls)+')));')
    actual=json.loads(run(['node',str(p/'run.mjs')]))
    assert actual==expected,[(i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b][:5]
    report={'passed':True,'compiled_native_node_cases':256,'source_scalars_arrays_and_count_verified':True,'gameplay_verified':False}
    if os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'):
        from playwright.sync_api import sync_playwright
        data=lambda value:'data:text/javascript;base64,'+base64.b64encode(value.encode()).decode()
        scanner=data((ROOT/'runtime/c_scanf.mjs').read_text().replace("'./source_bytes.mjs'",json.dumps(data((ROOT/'runtime/source_bytes.mjs').read_text()))))
        abi=data((ROOT/'runtime/abi.mjs').read_text())
        browser_host=host.replace(json.dumps((ROOT/'runtime/c_scanf.mjs').as_uri()),json.dumps(scanner)).replace(json.dumps((ROOT/'runtime/abi.mjs').as_uri()),json.dumps(abi))
        browser_module=module.read_text().replace('"../scan-host.mjs"',json.dumps(data(browser_host)))
        assert '../scan-host.mjs' not in browser_module
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(executable_path=os.environ['EDUKE_CHROMIUM_EXECUTABLE'],headless=True)
            page=browser.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            actual=page.evaluate(js,{'module':data(browser_module),'inputs':inputs,'scanner':scanner,'abi':abi})
            assert actual==expected and not errors,(actual[:5],errors)
            report.update(compiled_chromium_cases=256,browser_version=browser.version);browser.close()
    (ROOT/'reports/oct25-source-scanf-parity.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
