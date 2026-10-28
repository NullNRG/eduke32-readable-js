import test from 'node:test';
import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';
import {LLVMContext} from '../../runtime/llvm_context.mjs';
import {createCxxRBTreeABI} from '../../runtime/cxx_rbtree_abi.mjs';
import {createCStrftime} from '../../runtime/c_strftime.mjs';
import {createSDLBrowser} from '../../runtime/sdl_browser.mjs';
import {createPosixRuntime} from '../../runtime/c_posix.mjs';

test('Original ALSA defaults and IPv6 wildcard data are backed by actual C ABI globals',()=>{
 const c=new LLVMContext();const h=c.heap;
 assert.equal(h.read(c.ptr('ALSA_ClientID'),'i32'),0);
 assert.equal(h.read(c.ptr('ALSA_PortID'),'i32'),0);
 assert.deepEqual([...h.bytes(c.ptr('in6addr_any'),16)],Array(16).fill(0));
});

test('GNU x86-64 red-black tree insertion preserves ordering, colors, black heights and iterator ABI',()=>{
 const h=new ABIHeap();const s=createCxxRBTreeABI({heap:h});
 const insert=s._ZSt29_Rb_tree_insert_and_rebalancebPSt18_Rb_tree_node_baseS0_RS_;
 const inc=s._ZSt18_Rb_tree_incrementPSt18_Rb_tree_node_base;
 const dec=s._ZSt18_Rb_tree_decrementPSt18_Rb_tree_node_base;
 const header=h.malloc(32);h.memset(header,0,32);
 const put=(p,at,x)=>h.write(p+at,'u64',BigInt(x));
 const get=(p,at)=>p?Number(h.read(p+at,'u64')):0;
 put(header,16,header);put(header,24,header);h.write(header,'i32',0);
 const values=[23,7,19,11,99,1,3,45,35,20,55,66,32,2,5,9,74,31,6,13];
 const nodes=new Map();
 for(const v of values){
  const x=h.malloc(40);h.write(x+32,'i32',v);nodes.set(v,x);
  let p=header,z=get(header,8),isLeft=true;
  while(z){p=z;isLeft=v<h.read(z+32,'i32');z=get(z,isLeft?16:24);}
  insert(+isLeft,x,p,header);
  const root=get(header,8);assert.equal(h.read(root,'i32'),1);
  const check=(at,parent,min,max)=>{
   if(!at)return 1;
   assert.equal(get(at,8),parent);
   const key=h.read(at+32,'i32');assert.ok(key>min&&key<max);
   if(h.read(at,'i32')===0){
    if(get(at,16))assert.equal(h.read(get(at,16),'i32'),1);
    if(get(at,24))assert.equal(h.read(get(at,24),'i32'),1);
   }
   const l=check(get(at,16),at,min,key),r=check(get(at,24),at,key,max);
   assert.equal(l,r);return l+(h.read(at,'i32')===1?1:0);
  };
  check(root,header,-Infinity,Infinity);
  assert.equal(get(header,16),nodes.get(Math.min(...nodes.keys())));
  assert.equal(get(header,24),nodes.get(Math.max(...nodes.keys())));
 }
 const sorted=[...values].sort((a,b)=>a-b);
 let ptr=get(header,16);const got=[];
 for(let i=0;i<values.length;i++){got.push(h.read(ptr+32,'i32'));ptr=inc(ptr);}
 assert.deepEqual(got,sorted);assert.equal(ptr,header);
 ptr=dec(header);const descending=[];
 for(let i=0;i<values.length;i++){descending.push(h.read(ptr+32,'i32'));ptr=dec(ptr);}
 assert.deepEqual(descending,[...sorted].reverse());
});

test('strftime matches EDuke autosave formatter and respects output bounds',()=>{
 const h=new ABIHeap();const f=createCStrftime({heap:h}).strftime;
 const tm=h.malloc(56);h.memset(tm,0,56);
 [9,7,15,12,9,126,1,284,0].forEach((v,i)=>h.write(tm+i*4,'i32',v));
 h.write(tm+40,'i64',-25200n);h.write(tm+48,'u64',BigInt(h.writeCString('PDT')));
 const pat=h.writeCString('%d %b %Y %I:%M%p');const out=h.malloc(32);
 assert.equal(f(out,32n,pat,tm),19n);assert.equal(h.readCString(out),'12 Oct 2026 03:07PM');
 h.memset(out,0xaa,32);
 assert.equal(f(out,4n,pat,tm),0n);assert.equal(h.read(out,'u8'),0xaa);
 assert.throws(()=>f(out,32n,h.writeCString('%Q'),tm),/Unsupported/);
});

test('SDL modal dialogs carry real button ids through x86_64 ABI',()=>{
 const h=new ABIHeap();const history=[];const host={confirm:msg=>{history.push(msg);return false;},alert:msg=>history.push(msg)};
 const canvas={width:200,height:100,ownerDocument:{defaultView:host}};
 const api=createSDLBrowser({heap:h,canvas}).symbols;
 const title=h.writeCString('Crash'),msg=h.writeCString('Test message');
 assert.equal(api.SDL_ShowSimpleMessageBox(0,title,msg,0),0);assert.match(history.at(-1),/Crash/);
 const buttons=h.malloc(32);h.memset(buttons,0,32);
 h.write(buttons+4,'i32',23);h.write(buttons+8,'u64',BigInt(h.writeCString('Continue')));
 h.write(buttons+20,'i32',42);h.write(buttons+24,'u64',BigInt(h.writeCString('Quit')));
 const data=h.malloc(56);h.memset(data,0,56);
 h.write(data+16,'u64',BigInt(title));h.write(data+24,'u64',BigInt(msg));
 h.write(data+32,'i32',2);h.write(data+40,'u64',BigInt(buttons));
 const result=h.malloc(4);
 assert.equal(api.SDL_ShowMessageBox(data,result),0);assert.equal(h.read(result,'i32'),42);
});

test('mimalloc LLVM thread.pointer returns a stable nonzero distinct identity for each context',()=>{
 const a=new LLVMContext(),b=new LLVMContext();
 const x=a.call('llvm.thread.pointer',[]);
 assert.ok(x>0);assert.equal(x,a.call('llvm.thread.pointer',[]));
 // Each context uses its own ABI heap, so numeric pointer equality is not
 // a cross-context identity promise. There is no multi-thread implementation.
 b.threadModel='multi';assert.throws(()=>b.call('llvm.thread.pointer',[]),/per-thread/);
});

test('Arbitrary-width LLVM packed integer memory layouts round-trip i24, i40, i72 and i128',()=>{
 const c=new LLVMContext(),h=c.heap;
 for(const [bits,input] of [[24,0xabcdefn],[40,0x123456789an],[72,0x112233445566778899n],[128,-1n]]){
  const ptr=h.malloc(Math.ceil(bits/8));c.store(ptr,'i'+bits,input);
  const stored=c.load(ptr,'i'+bits);
  const expected=BigInt.asIntN(bits,input);
  assert.equal(BigInt(stored),expected);
  assert.equal(h.bytes(ptr,1)[0],Number(BigInt.asUintN(8,input)));
 }
});

test('glibc x86_64 signal registration and 152-byte sigaction layout retain handlers and dispatch software raise',()=>{
 const h=new ABIHeap();const delivered=[];
 const errno=h.malloc(4);const posix=createPosixRuntime({heap:h,errnoLocation:()=>errno,callIndirect:(f,args)=>delivered.push([f,args])});
 const previous=posix.signal(11,0x1008);assert.equal(previous,0);
 assert.equal(posix.signal(11,0x100a),0x1008);
 const old=h.malloc(152);const next=h.malloc(152);h.memset(next,0,152);
 h.write(next,'u64',0x2080n);h.write(next+136,'i32',0x10000000);
 assert.equal(posix.sigaction(11,next,old),0);
 assert.equal(h.read(old,'u64'),0x100an);
 assert.equal(posix.raise(11),0);assert.deepEqual(delivered,[[0x2080,[11]]]);
 assert.equal(posix.signal(11,1),0x2080);
 assert.equal(posix.raise(11),0);
 assert.equal(posix.signal(0,1),-1);assert.equal(h.read(errno,'i32'),22);
 assert.throws(()=>posix.raise(6),/Default C signal action/);
});

test('glibc recursive static pthread mutex kind 1 supports nested locks and preserves errorcheck semantics',async()=>{
 const {createPthreadSingle}=await import('../../runtime/c_pthreads.mjs');
 const h=new ABIHeap(), api=createPthreadSingle({heap:h});
 const m=h.malloc(40);h.memset(m,0,40);h.write(m+16,'i32',1);
 assert.equal(api.pthread_mutex_lock(m),0);
 assert.equal(api.pthread_mutex_lock(m),0);
 assert.equal(api.pthread_mutex_unlock(m),0);
 assert.equal(api.pthread_mutex_trylock(m),0);
 assert.equal(api.pthread_mutex_unlock(m),0);
 assert.equal(api.pthread_mutex_unlock(m),0);
 assert.equal(api.pthread_mutex_destroy(m),0);
 const e=h.malloc(40);h.memset(e,0,40);h.write(e+16,'i32',2);
 assert.equal(api.pthread_mutex_lock(e),0);
 assert.equal(api.pthread_mutex_lock(e),35);
 assert.equal(api.pthread_mutex_unlock(e),0);
});

test('GNU Itanium demangle uses original source symbol table and correct ABI status',async()=>{
 const {createCxxDemangleABI}=await import('../../runtime/cxx_demangle_abi.mjs');
 const h=new ABIHeap();const api=createCxxDemangleABI({heap:h,alloc:n=>h.malloc(Number(n)),realloc:(p,n)=>h.realloc(p,Number(n))});
 const status=h.malloc(4);const name=h.writeCString('_Z18engineSetupLoggingRiPPc');
 const demangled=api.__cxa_demangle(name,0,0,status);
 assert.ok(demangled>0);assert.match(h.readCString(demangled),/engineSetupLogging/);
 assert.equal(h.read(status,'i32'),0);
 assert.equal(api.__cxa_demangle(h.writeCString('_Zbogus'),0,0,status),0);
 assert.equal(h.read(status,'i32'),-2);
 assert.equal(api.__cxa_demangle(0,0,0,status),0);assert.equal(h.read(status,'i32'),-3);
});

test('translated original call frames produce symbolized ABI backtrace with one freeable allocation',()=>{
 const c=new LLVMContext();const h=c.heap;
 c.register('mi_malloc',n=>h.malloc(Number(n)));
 const frames=h.malloc(80);
 c.register('test_inner',()=>c.call('backtrace',[frames,10]));
 c.register('test_outer',()=>c.call('test_inner',[]));
 const count=c.call('test_outer',[]);assert.equal(count,2);
 assert.equal(h.read(frames,'u64'),BigInt(c.ptr('test_inner')));
 assert.equal(h.read(frames+8,'u64'),BigInt(c.ptr('test_outer')));
 const texts=c.call('backtrace_symbols',[frames,count]);
 assert.equal(typeof texts,'number');
 assert.match(h.readCString(Number(h.read(texts,'u64'))),/test_inner/);
 assert.match(h.readCString(Number(h.read(texts+8,'u64'))),/test_outer/);
 h.free(texts);
});
