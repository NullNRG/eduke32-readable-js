import test from 'node:test';
import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';
import {createCLocaleABI} from '../../runtime/c_locale_abi.mjs';
test('C++ ctype function calls use the actual glibc C-locale tables',()=>{
 const heap=new ABIHeap(),symbols=createCLocaleABI({heap});
 const base=Number(heap.read(symbols.__ctype_b_loc(),'u64'));
 const upper=Number(heap.read(symbols.__ctype_toupper_loc(),'u64'));
 const masks={isupper:256,islower:512,isalpha:1024,isdigit:2048,isxdigit:4096,isspace:8192,
   isprint:16384,isgraph:32768,isblank:1,iscntrl:2,ispunct:4,isalnum:8};
 for(let value=-128;value<256;value++){
  for(const [name,mask] of Object.entries(masks))assert.equal(symbols[name](value),heap.read(base+value*2,'u16')&mask);
  assert.equal(symbols.toupper(value),heap.read(upper+value*4,'i32'));
  const byte=value< -1?value+256:value;
  assert.equal(symbols.tolower(value),byte>=65&&byte<=90?byte+32:byte);
 }
 assert.equal(symbols.isdigit(48),2048);assert.equal(symbols.isdigit(-1),0);
 assert.throws(()=>symbols.isdigit(256),RangeError);
 assert.throws(()=>symbols.toupper(-129),RangeError);
});
