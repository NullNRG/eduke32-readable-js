import test from 'node:test';import assert from 'node:assert/strict';
import {ABIHeap} from '../../runtime/abi.mjs';import {createStdlib} from '../../runtime/stdlib.mjs';
test('getrusage Linux ABI is backed by actual Node resource counters',()=>{
 const heap=new ABIHeap(),s=createStdlib({heap}).symbols,buf=heap.malloc(144);
 const before=process.resourceUsage();assert.equal(s.getrusage(0,buf),0);
 const user=heap.read(buf,'i64')*1000000n+heap.read(buf+8,'i64');
 assert.ok(user>=BigInt(before.userCPUTime));
 assert.equal(heap.read(buf+32,'i64'),BigInt(before.maxRSS));
 assert.equal(s.getrusage(-1,buf),-1);
});
test('nanosleep uses synchronous host wait and leaves no remaining time',()=>{
 const heap=new ABIHeap(),s=createStdlib({heap}).symbols;
 const req=heap.calloc(1,16),rem=heap.calloc(1,16);
 heap.write(req,'i64',0n);heap.write(req+8,'i64',1000000n);
 assert.equal(s.nanosleep(req,rem),0);
 assert.equal(heap.read(rem+8,'i64'),0n);
 heap.write(req+8,'i64',1000000000n);assert.equal(s.nanosleep(req,rem),-1);
});
test('kill delivers registered C signal in virtual single-process ABI only',()=>{
 const heap=new ABIHeap(),calls=[];const s=createStdlib({heap,callIndirect:(fn,args)=>{calls.push([fn,args]);}}).symbols;
 assert.equal(s.kill(1,0),0);assert.equal(s.kill(999,0),-1);
 s.signal(10,123);assert.equal(s.kill(1,10),0);assert.deepEqual(calls,[[123,[10]]]);
});
