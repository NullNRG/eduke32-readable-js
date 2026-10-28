import test from 'node:test';
import assert from 'node:assert/strict';
import {register as oldGame} from '../fixtures/stage17_cfg/game.mjs';
import {register as oldNames} from '../fixtures/stage17_cfg/dnames.mjs';
import {register as newGame} from '../../factory-output/whole-program/modules/source/duke3d/src/game.cpp.mjs';
import {register as newNames} from '../../factory-output/whole-program/modules/source/duke3d/src/dnames.cpp.mjs';

function createEnvironment({gameType=0,openChoice=0,hashResult=0,strcmpResult=0,budget=80}={}){
  const trace=[];
  const registered=new Map();
  const hashedString=x=>[...x].reduce((n,c)=>(Math.imul(n,33)+c.charCodeAt(0))>>>0,5381) & 0x7fffff;
  const ctx={
    register:(name,fn)=>registered.set(name,fn),
    instructionBudget:budget,
    ptr:hashedString,
    offset:value=>Number(value),
    load:(addr,kind)=>addr===hashedString('g_gameType')?gameType:12,
    store:(ptr,typ,val)=>trace.push(['store',ptr,typ,String(val)]),
    call:(symbol,args)=>{
      trace.push(['call',symbol,args.map(String)]);
      if(symbol==='testkopen')return openChoice===0?0:openChoice===1?3:-1;
      if(symbol==='hash_find')return hashResult;
      if(symbol==='strcmp')return strcmpResult;
      return 0;
    },
    requireDefined:v=>v,
    blockProgress:(...v)=>trace.push(['progress',...v])
  };
  return {ctx,registered,trace};
}
function exercise(register,symbol,args,options){
  const {ctx,registered,trace}=createEnvironment(options);
  register(ctx);
  const fn=registered.get(symbol);
  assert.equal(typeof fn,'function',symbol);
  try{return {value:String(fn(...args)),trace};}
  catch(error){return {error:String(error.message),trace};}
}
test('real G_DefaultRtsFile: PHI edges, return pointer, calls and budget parity',()=>{
  const symbol='G_DefaultRtsFile';let cases=0;
  for(let gameType=0;gameType<32;gameType++)for(let openChoice=0;openChoice<3;openChoice++)for(const budget of [1,2,3,5,20]){
    const options={gameType,openChoice,budget};
    assert.deepEqual(exercise(newGame,symbol,[],options),exercise(oldGame,symbol,[],options),JSON.stringify(options));
    cases++;
  }
  assert.equal(cases,480);
});
test('real G_ProcessDynamicNameMapping: LLVM conditional effects and budget parity',()=>{
  const symbol='_Z27G_ProcessDynamicNameMappingPKcP7dynitems';let cases=0;
  for(const tile of [0,30719,30720,65535])for(const ptr of [0,12345])for(const hashResult of [0,1,0x80000000])for(const strcmpResult of [0,-1])for(const budget of [1,2,3,5,20]){
    const options={hashResult,strcmpResult,budget};
    const args=[ptr,100000,tile];
    assert.deepEqual(exercise(newNames,symbol,args,options),exercise(oldNames,symbol,args,options),JSON.stringify({args,...options}));
    cases++;
  }
  assert.equal(cases,240);
});
