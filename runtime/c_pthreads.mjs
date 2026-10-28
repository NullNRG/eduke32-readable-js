/** Single-JS-thread subset of Linux x86-64 pthread synchronization.
 * Never represents contended blocking or extra OS threads as working.
 */
export function createPthreadSingle({heap,callIndirect,threadModel=()=> 'single'}={}) {
  if(!heap)throw TypeError('pthread heap required');
  const EINVAL=22,EBUSY=16,EDEADLK=35,EPERM=1,ENOTSUP=95;
  const mutexes=new Map(),destroyed=new Set(),onced=new Set();
  const tlsKeys=new Map();let nextKey=1;
  function check(ptr){heap.check(ptr,40);return ptr;}
  function state(ptr){
    check(ptr);
    if(destroyed.has(ptr))return null;
    if(mutexes.has(ptr))return mutexes.get(ptr);
    // glibc x86-64 pthread_mutex_t is 40 bytes; __kind at +16.
    // PTHREAD_MUTEX_INITIALIZER: kind 0, RECURSIVE_MUTEX_INITIALIZER_NP:
    // kind 1, ERRORCHECK_MUTEX_INITIALIZER_NP: kind 2, ADAPTIVE: kind 3.
    // Other nonzero bytes mean we cannot infer a pristine static initializer.
    const bytes=heap.bytes(ptr,40);
    const kind=heap.read(ptr+16,'i32');
    if(kind<0||kind>3||bytes.some((byte,i)=>i!==16&&byte!==0))return null;
    const s={count:0,kind};mutexes.set(ptr,s);return s;
  }
  function supported(){return threadModel()==='single';}
  return Object.freeze({
    pthread_mutex_init:(ptr,attr)=>{
      check(ptr);
      if(attr!==0)return ENOTSUP; // attributes (recursive/robust/pshared) not modeled
      if(!supported())return ENOTSUP;
      heap.memset(ptr,0,40);destroyed.delete(ptr);mutexes.set(ptr,{count:0,kind:0});return 0;
    },
    pthread_mutex_destroy:ptr=>{
      if(!supported())return ENOTSUP;
      const s=state(ptr);if(!s)return EINVAL;if(s.count>0)return EBUSY;
      mutexes.delete(ptr);destroyed.add(ptr);return 0;
    },
    pthread_mutex_lock:ptr=>{
      if(!supported())return ENOTSUP;
      const s=state(ptr);if(!s)return EINVAL;
      if(s.count){
        if(s.kind===1){s.count++;return 0;} // same-thread recursive mutex
        return EDEADLK; // cannot block the single JavaScript thread
      }
      s.count=1;return 0;
    },
    pthread_mutex_trylock:ptr=>{
      if(!supported())return ENOTSUP;
      const s=state(ptr);if(!s)return EINVAL;
      if(s.count){if(s.kind===1){s.count++;return 0;}return EBUSY;}s.count=1;return 0;
    },
    pthread_mutex_unlock:ptr=>{
      if(!supported())return ENOTSUP;
      const s=state(ptr);if(!s)return EINVAL;
      if(!s.count)return EPERM;s.count--;return 0;
    },
    pthread_self:()=>1n,
    pthread_key_create:(out,destructor)=>{
      if(!supported())return ENOTSUP;
      heap.check(out,4);
      const key=nextKey++;
      tlsKeys.set(key,{value:0,destructor});heap.write(out,'u32',key);return 0;
    },
    pthread_key_delete:key=>tlsKeys.delete(Number(key))?0:EINVAL,
    pthread_getspecific:key=>tlsKeys.get(Number(key))?.value??0,
    pthread_setspecific:(key,value)=>{
      const row=tlsKeys.get(Number(key));if(!row)return EINVAL;
      if(!supported())return ENOTSUP;
      row.value=value;return 0;
    },
    pthread_once:(control,fnptr)=>{
      if(!supported())return ENOTSUP;
      heap.check(control,4);
      const status=heap.read(control,'i32');
      if(status===2)return 0;
      if(status!==0)return status===1?EDEADLK:EINVAL;
      if(typeof callIndirect!=='function')throw Error('pthread_once callback dispatcher unavailable');
      heap.write(control,'i32',1);
      try{callIndirect(Number(fnptr),[]);heap.write(control,'i32',2);onced.add(control);}
      catch(err){heap.write(control,'i32',0);throw err;}
      return 0;
    },
  });
}
