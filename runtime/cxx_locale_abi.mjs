/** GNU libstdc++ Itanium/x86-64, C-classic std::locale subset.
 * ABI evidence: libstdc++ locale_classes.h and native GCC 14 probes.
 * Full Unicode/named locales, facet virtual dispatch, and nonclassic facets
 * are NOT implemented; never advertise a full C++ locale runtime.
 */
export function createCxxLocaleABI({heap, ctypeId, collateId}={}) {
  if (!heap) throw TypeError('C++ locale ABI requires an addressable heap');
  if (!ctypeId || !collateId) throw TypeError('C++ locale ABI requires real static locale::id globals');
  const number=x=>{const n=Number(x);if(!Number.isSafeInteger(n)||n<0)throw RangeError('Invalid C++ ABI pointer');return n;};
  const load=(p,offset=0)=>Number(heap.read(number(p)+offset,'u64'));
  const store=(p,n,offset=0)=>heap.write(number(p)+offset,'u64',BigInt(number(n)));
  // locale::id::_M_id returns a zero-based facet slot. Native GCC 14:
  // std::ctype<char>::id -> 0; std::collate<char>::id -> 5.
  const ids=new Map([[ctypeId,0],[collateId,5]]);
  const list=heap.calloc(48,8);
  const ctype=heap.calloc(1,576);
  const collate=heap.calloc(1,24);
  const impl=heap.calloc(1,64);
  store(list,ctype);store(list+5*8,collate);
  heap.write(impl,'i32',1);store(impl,list,8);store(impl,48,16);
  // The ctype<char> base stores a vptr at +0, _M_refcount at +8,
  // _M_table at +48, _M_widen_ok at +56, _M_widen[256] at +57.
  // The full vtable cannot be populated until virtual libstdc++ facets
  // are implemented: a vptr of zero intentionally traps unsafe use.
  heap.write(ctype+8,'i32',1);heap.write(collate+8,'i32',1);
  const upper=heap.calloc(256,4),lower=heap.calloc(256,4),masks=heap.calloc(256,2);
  // Keep C-locale byte maps real, without pretending non-C locales work.
  for(let i=0;i<256;i++){
    heap.write(upper+i*4,'i32',i>=97&&i<=122?i-32:i);
    heap.write(lower+i*4,'i32',i>=65&&i<=90?i+32:i);
  }
  store(ctype,upper,32);store(ctype,lower,40);store(ctype,masks,48);
  const live=new Map([[impl,0]]);
  const retain=p=>{if(p!==impl || !live.has(p))throw Error('Unrecognized std::locale implementation');let n=live.get(p)+1;live.set(p,n);heap.write(impl,'i32',n+1);};
  const release=p=>{if(p!==impl || !live.has(p))throw Error('Unrecognized std::locale implementation');let n=live.get(p)-1;if(n<0)throw Error('std::locale reference count underflow');live.set(p,n);heap.write(impl,'i32',n+1);};
  const check=p=>{const x=load(p);if(!x)throw Error('Uninitialized std::locale');if(x!==impl)throw Error('Unsupported nonclassic std::locale');return x;};
  const defaultCtor=p=>{heap.check(number(p),8);retain(impl);store(p,impl);};
  const copyCtor=(p,q)=>{heap.check(number(p),8);const other=check(q);retain(other);store(p,other);};
  const dtor=p=>{const x=check(p);release(x);store(p,0);};
  const assign=(p,q)=>{const next=check(q),prev=check(p);if(next!==prev){retain(next);store(p,next);release(prev);}return number(p);};
  const widenInit=p=>{heap.check(number(p),576); // char widen for the actual classic C locale
    // Strictly require this facet; do not mutate arbitrary C++ objects.
    if(number(p)!==ctype)throw Error('Unrecognized std::ctype<char> facet');
    for(let i=0;i<256;i++)heap.write(p+57+i,'u8',i);
    heap.write(p+56,'u8',1);
  };
  return Object.freeze({
    '_ZNSt6localeC1Ev':defaultCtor,
    '_ZNSt6localeC1ERKS_':copyCtor,
    '_ZNSt6localeD1Ev':dtor,
    '_ZNSt6localeaSERKS_':assign,
    '_ZNKSt6locale2id5_M_idEv':p=>{
      p=number(p);if(!ids.has(p))throw Error('Unimplemented std::locale facet id');
      return BigInt(ids.get(p));
    },
    '_ZNKSt5ctypeIcE13_M_widen_initEv':widenInit,
  });
}
