/** libstdc++ fatal/throw helper entry points.
 * EDuke32's source was compiled without C++ exception unwinding: these
 * functions are noreturn error exits on execution paths that invoke them.
 * JS error propagation deliberately stops the compiled program. This is
 * NOT a replacement for C++ typed exception catching or stack unwinding.
 */
export function createCxxFailureABI({heap}={}){
  if(!heap)throw TypeError('C++ failure ABI requires heap');
  const error=(kind,message)=>{const e=new Error(message);e.name=kind;throw e;};
  const text=ptr=>ptr?heap.readCString(Number(ptr)):'(null)';
  return Object.freeze({
    _ZSt16__throw_bad_castv:()=>error('std::bad_cast','Invalid dynamic_cast'),
    _ZSt17__throw_bad_allocv:()=>error('std::bad_alloc','Allocation failure'),
    _ZSt19__throw_logic_errorPKc:ptr=>error('std::logic_error',text(ptr)),
    _ZSt19__throw_regex_errorNSt15regex_constants10error_typeE:code=>error('std::regex_error','regex error code '+code),
    _ZSt20__throw_length_errorPKc:ptr=>error('std::length_error',text(ptr)),
    _ZSt20__throw_system_errori:code=>error('std::system_error','system error '+code),
    _ZSt24__throw_out_of_range_fmtPKcz:ptr=>error('std::out_of_range',text(ptr)),
    _ZSt25__throw_bad_function_callv:()=>error('std::bad_function_call','empty function call'),
    _ZSt28__throw_bad_array_new_lengthv:()=>error('std::bad_array_new_length','invalid array allocation'),
    _ZSt9terminatev:()=>error('std::terminate','C++ termination requested'),
    __cxa_pure_virtual:()=>error('std::terminate','Pure virtual method invoked'),
    // libstdc++ ABI: std::thread::_State base destructor is an empty ret
    // (verified from the actual x86-64 libstdc++ implementation).
    _ZNSt6thread6_StateD2Ev:()=>undefined,
  });
}
