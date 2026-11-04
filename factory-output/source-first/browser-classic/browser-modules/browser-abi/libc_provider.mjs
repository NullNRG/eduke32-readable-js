// Auto-generated from NativeRuntime's real, tested C ABI table.
import {bindLoguruHeap} from './loguru_provider.mjs';
import {sourceHeapAddress} from "../../../../../runtime/source_bytes.mjs";
let active=null;
export const BROWSER_C_SYMBOLS=Object.freeze(["Bcorrectfilename", "Bgetappdir", "Bgethomedir", "Bstrncpyz", "G_AddSearchPaths", "_ZNKSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE4findEPKcmm", "_ZNKSt8__detail20_Prime_rehash_policy11_M_next_bktEm", "_ZNKSt8__detail20_Prime_rehash_policy14_M_need_rehashEmmm", "_ZNSt6chrono3_V212steady_clock3nowEv", "_ZNSt6chrono3_V212system_clock3nowEv", "_ZNSt6thread20hardware_concurrencyEv", "_ZNSt6thread6_StateD2Ev", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE10_M_replaceEmmPKcm", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE12_M_constructEmc", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE14_M_replace_auxEmmmc", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE4findEPKcmm", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE6resizeEmc", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE7reserveEm", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_appendEPKcm", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_assignERKS4_", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_createERmm", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_mutateEmmPKcm", "_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEED2Ev", "_ZSt16__throw_bad_castv", "_ZSt17__throw_bad_allocv", "_ZSt18_Rb_tree_decrementPSt18_Rb_tree_node_base", "_ZSt18_Rb_tree_incrementPSt18_Rb_tree_node_base", "_ZSt19__throw_logic_errorPKc", "_ZSt19__throw_regex_errorNSt15regex_constants10error_typeE", "_ZSt20__throw_length_errorPKc", "_ZSt20__throw_system_errori", "_ZSt24__throw_out_of_range_fmtPKcz", "_ZSt25__throw_bad_function_callv", "_ZSt28__throw_bad_array_new_lengthv", "_ZSt29_Rb_tree_insert_and_rebalancebPSt18_Rb_tree_node_baseS0_RS_", "_ZSt9terminatev", "__ctype_b_loc", "__ctype_toupper_loc", "__cxa_pure_virtual", "__errno_location", "__h_errno_location", "__isoc23_sscanf", "__isoc23_strtol", "__isoc23_strtoll", "__isoc23_strtoul", "__isoc23_strtoull", "__isoc99_sscanf", "abort", "acosf", "addsearchpath_user", "atan2f", "atanf", "backtrace", "backtrace_symbols", "backtrace_symbols_fd", "bcmp", "buildvfs_exists", "buildvfs_isdir", "calloc", "chdir", "clock_gettime", "clock_gettime_ms", "close", "closedir", "closelog", "cos", "cosf", "dirname", "exp", "exp2", "exp2f", "expf", "fclose", "fcntl", "fdopen", "ferror", "fflush", "fgetc", "fileno", "fmod", "fmodf", "fopen", "fprintf", "fputc", "fputs", "fread", "free", "freeaddrinfo", "freopen", "fseek", "fstat", "ftell", "fwrite", "getaddrinfo", "getcwd", "getenv", "gethostbyname", "gethostname", "getnameinfo", "getpid", "getpwuid", "getrusage", "gettimeofday", "getuid", "inet_addr", "inet_ntoa", "inet_ntop", "inet_pton", "isalnum", "isalpha", "isatty", "isblank", "iscntrl", "isdigit", "isgraph", "islower", "isprint", "ispunct", "isspace", "isupper", "isxdigit", "kill", "ldexp", "ldexpf", "listsearchpath", "lldiv", "llrintf", "localtime", "localtime_r", "log", "log10f", "logf", "lrint", "lrintf", "lseek", "madvise", "malloc", "memchr", "memcmp", "memcpy", "memmove", "memset", "mkdir", "mmap", "mprotect", "munmap", "nanosleep", "open", "opendir", "openlog", "perror", "poll", "pow", "powf", "prctl", "printf", "pthread_getspecific", "pthread_key_create", "pthread_key_delete", "pthread_mutex_destroy", "pthread_mutex_init", "pthread_mutex_lock", "pthread_mutex_trylock", "pthread_mutex_unlock", "pthread_once", "pthread_self", "pthread_setspecific", "puts", "qsort", "raise", "rand", "read", "readdir", "realloc", "realpath", "removesearchpaths_withuser", "sdlayer_checkversion", "setvbuf", "sigaction", "sigemptyset", "signal", "sin", "sinf", "snprintf", "sprintf", "sqrt", "sqrtf", "srand", "sscanf", "stat", "strcasecmp", "strcat", "strchr", "strcmp", "strcpy", "strerror", "strerror_r", "strftime", "strlen", "strncasecmp", "strncat", "strncmp", "strncpy", "strrchr", "strstr", "strtod", "strtol", "strtoll", "strtoul", "strtoull", "sysReadCPUID", "syscall", "sysconf", "syslog", "tan", "tanf", "testkopen", "time", "timerInit", "tolower", "toupper", "unlink", "vsnprintf", "wm_setapptitle", "write"]);
export function bindBrowserC(runtime) {
  if (active) throw new Error('Browser C ABI already bound');
  const symbols=runtime?.library?.symbols;
  if (!symbols) throw new TypeError('NativeRuntime C services required');
  for (const name of BROWSER_C_SYMBOLS) if (typeof symbols[name]!=='function')
    throw new Error('Missing implemented browser C function: '+name);
  const releaseLoguru=bindLoguruHeap(runtime.heap);
  active={symbols,heap:runtime.heap};
  let detached=false;
  return ()=>{if (!detached){detached=true;releaseLoguru();if (active?.symbols===symbols)active=null;}};
}
// C literals and stack arrays emitted by Clang are Uint8Array, while POSIX
// routines use numeric pointers into the project's explicit C ABI heap.
// Original source-first C pointer arrays are byte views; the native host C
// heap uses numeric addresses. For owned string returns, preserve pointer
// lifetime via identity so the original allocator can free the same storage.
const ownedCStrings=new WeakMap();
const sourceOwnedString=name=>{
  const ptr=call(name,[]);
  if (!ptr) return null;
  const size=active.heap.strlen(ptr)+1;
  const view=active.heap.u8.subarray(ptr,ptr+size);
  ownedCStrings.set(view,{ptr,heap:active.heap});
  return view;
};
const freeSourceValue=value=>{
  if (value instanceof Uint8Array && ownedCStrings.has(value)) {
    const {ptr,heap}=ownedCStrings.get(value);
    ownedCStrings.delete(value); heap.free(ptr); return;
  }
  return call('free',[value]);
};
const cStringBytes=value=>{
  if (!(value instanceof Uint8Array)) throw new TypeError('Expected original C byte array');
  const end=value.indexOf(0);
  if (end<0) throw new TypeError('Original C string lacks a terminating NUL');
  return value.subarray(0,end+1);
};
const withCStrings=(args,indexes,fn)=>{
  const copied=[...args],owned=[];
  try {
    for (const index of indexes) if (copied[index] instanceof Uint8Array){
      const bytes=cStringBytes(copied[index]),p=active.heap.malloc(bytes.length);
      owned.push(p);active.heap.u8.set(bytes,p);copied[index]=p;
    }
    return fn(copied);
  } finally {for(const p of owned)active.heap.free(p);}
};
// Directory handles and dirent results are borrowed ORIGINAL host-heap
// allocations. Source pointer fields must store their real LP64 addresses;
// raw host numbers cannot be treated as unrelated source address tokens.
const sourceAllocatedPointer=ptr=>{
  if(!ptr)return null;
  const size=active.heap.allocations.get(ptr);
  if(!Number.isSafeInteger(size)||size<1)throw new TypeError('Directory service returned no live allocation');
  return active.heap.borrow(ptr,size);
};
const call=(name,args)=>{
  if (!active) throw new Error('Browser C ABI is not bound: '+name);
  const fn=active.symbols[name];
  if (typeof fn!=='function') throw new Error('Browser C ABI missing actual implementation: '+name);
  if(name==='opendir')return withCStrings(args,[0],a=>sourceAllocatedPointer(fn(...a)));
  if(name==='readdir')return sourceAllocatedPointer(fn(sourceHeapAddress(args[0],active.heap)));
  if(name==='closedir')return fn(sourceHeapAddress(args[0],active.heap));
  if ((name==='chdir'||name==='mkdir'||name==='stat'||name==='open'||name==='unlink') && args[0] instanceof Uint8Array)
    return withCStrings(args,[0],a=>fn(...a));
  if (name==='getcwd' && args[0] instanceof Uint8Array){
    const out=args[0],count=Number(args[1]);
    if(!Number.isSafeInteger(count)||count<1||count>out.length)throw new RangeError('getcwd destination outside Clang array');
    const ptr=active.heap.malloc(count);
    try {
      const success=fn(ptr,count);
      if (!success)return null;
      const n=active.heap.u8.subarray(ptr,ptr+count).indexOf(0);
      if (n<0)throw new RangeError('getcwd output not terminated');
      out.set(active.heap.u8.subarray(ptr,ptr+n+1));
      return out;
    } finally {active.heap.free(ptr);}
  }
  if (name==='strcat' && args[0] instanceof Uint8Array && args[1] instanceof Uint8Array){
    const dst=args[0],src=cStringBytes(args[1]),end=dst.indexOf(0);
    if(end<0||end+src.length>dst.length)throw new RangeError('C strcat exceeds original destination storage');
    dst.set(src,end);return dst;
  }
  return fn(...args);
};
export function Bcorrectfilename(...args){return call("Bcorrectfilename",args);}
export function Bgetappdir(){return sourceOwnedString("Bgetappdir");}
export function Bgethomedir(){return sourceOwnedString("Bgethomedir");}
export function Bstrncpyz(...args){return call("Bstrncpyz",args);}
export function G_AddSearchPaths(...args){return call("G_AddSearchPaths",args);}
export function _ZNKSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE4findEPKcmm(...args){return call("_ZNKSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE4findEPKcmm",args);}
export function _ZNKSt8__detail20_Prime_rehash_policy11_M_next_bktEm(...args){return call("_ZNKSt8__detail20_Prime_rehash_policy11_M_next_bktEm",args);}
export function _ZNKSt8__detail20_Prime_rehash_policy14_M_need_rehashEmmm(...args){return call("_ZNKSt8__detail20_Prime_rehash_policy14_M_need_rehashEmmm",args);}
export function _ZNSt6chrono3_V212steady_clock3nowEv(...args){return call("_ZNSt6chrono3_V212steady_clock3nowEv",args);}
export function _ZNSt6chrono3_V212system_clock3nowEv(...args){return call("_ZNSt6chrono3_V212system_clock3nowEv",args);}
export function _ZNSt6thread20hardware_concurrencyEv(...args){return call("_ZNSt6thread20hardware_concurrencyEv",args);}
export function _ZNSt6thread6_StateD2Ev(...args){return call("_ZNSt6thread6_StateD2Ev",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE10_M_replaceEmmPKcm(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE10_M_replaceEmmPKcm",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE12_M_constructEmc(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE12_M_constructEmc",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE14_M_replace_auxEmmmc(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE14_M_replace_auxEmmmc",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE4findEPKcmm(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE4findEPKcmm",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE6resizeEmc(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE6resizeEmc",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE7reserveEm(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE7reserveEm",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_appendEPKcm(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_appendEPKcm",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_assignERKS4_(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_assignERKS4_",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_createERmm(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_createERmm",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_mutateEmmPKcm(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEE9_M_mutateEmmPKcm",args);}
export function _ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEED2Ev(...args){return call("_ZNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEED2Ev",args);}
export function _ZSt16__throw_bad_castv(...args){return call("_ZSt16__throw_bad_castv",args);}
export function _ZSt17__throw_bad_allocv(...args){return call("_ZSt17__throw_bad_allocv",args);}
export function _ZSt18_Rb_tree_decrementPSt18_Rb_tree_node_base(...args){return call("_ZSt18_Rb_tree_decrementPSt18_Rb_tree_node_base",args);}
export function _ZSt18_Rb_tree_incrementPSt18_Rb_tree_node_base(...args){return call("_ZSt18_Rb_tree_incrementPSt18_Rb_tree_node_base",args);}
export function _ZSt19__throw_logic_errorPKc(...args){return call("_ZSt19__throw_logic_errorPKc",args);}
export function _ZSt19__throw_regex_errorNSt15regex_constants10error_typeE(...args){return call("_ZSt19__throw_regex_errorNSt15regex_constants10error_typeE",args);}
export function _ZSt20__throw_length_errorPKc(...args){return call("_ZSt20__throw_length_errorPKc",args);}
export function _ZSt20__throw_system_errori(...args){return call("_ZSt20__throw_system_errori",args);}
export function _ZSt24__throw_out_of_range_fmtPKcz(...args){return call("_ZSt24__throw_out_of_range_fmtPKcz",args);}
export function _ZSt25__throw_bad_function_callv(...args){return call("_ZSt25__throw_bad_function_callv",args);}
export function _ZSt28__throw_bad_array_new_lengthv(...args){return call("_ZSt28__throw_bad_array_new_lengthv",args);}
export function _ZSt29_Rb_tree_insert_and_rebalancebPSt18_Rb_tree_node_baseS0_RS_(...args){return call("_ZSt29_Rb_tree_insert_and_rebalancebPSt18_Rb_tree_node_baseS0_RS_",args);}
export function _ZSt9terminatev(...args){return call("_ZSt9terminatev",args);}
export function __ctype_b_loc(...args){return call("__ctype_b_loc",args);}
export function __ctype_toupper_loc(...args){return call("__ctype_toupper_loc",args);}
export function __cxa_pure_virtual(...args){return call("__cxa_pure_virtual",args);}
export function __errno_location(...args){return call("__errno_location",args);}
export function __h_errno_location(...args){return call("__h_errno_location",args);}
export function __isoc23_sscanf(...args){return call("__isoc23_sscanf",args);}
export function __isoc23_strtol(...args){return call("__isoc23_strtol",args);}
export function __isoc23_strtoll(...args){return call("__isoc23_strtoll",args);}
export function __isoc23_strtoul(...args){return call("__isoc23_strtoul",args);}
export function __isoc23_strtoull(...args){return call("__isoc23_strtoull",args);}
export function __isoc99_sscanf(...args){return call("__isoc99_sscanf",args);}
export function abort(...args){return call("abort",args);}
export function acosf(...args){return call("acosf",args);}
export function addsearchpath_user(...args){return call("addsearchpath_user",args);}
export function atan2f(...args){return call("atan2f",args);}
export function atanf(...args){return call("atanf",args);}
export function backtrace(...args){return call("backtrace",args);}
export function backtrace_symbols(...args){return call("backtrace_symbols",args);}
export function backtrace_symbols_fd(...args){return call("backtrace_symbols_fd",args);}
export function bcmp(...args){return call("bcmp",args);}
export function buildvfs_exists(...args){return call("buildvfs_exists",args);}
export function buildvfs_isdir(...args){return call("buildvfs_isdir",args);}
export function calloc(...args){return call("calloc",args);}
export function chdir(...args){return call("chdir",args);}
export function clock_gettime(...args){return call("clock_gettime",args);}
export function clock_gettime_ms(...args){return call("clock_gettime_ms",args);}
export function close(...args){return call("close",args);}
export function closedir(...args){return call("closedir",args);}
export function closelog(...args){return call("closelog",args);}
export function cos(...args){return call("cos",args);}
export function cosf(...args){return call("cosf",args);}
export function dirname(...args){return call("dirname",args);}
export function exp(...args){return call("exp",args);}
export function exp2(...args){return call("exp2",args);}
export function exp2f(...args){return call("exp2f",args);}
export function expf(...args){return call("expf",args);}
export function fclose(...args){return call("fclose",args);}
export function fcntl(...args){return call("fcntl",args);}
export function fdopen(...args){return call("fdopen",args);}
export function ferror(...args){return call("ferror",args);}
export function fflush(...args){return call("fflush",args);}
export function fgetc(...args){return call("fgetc",args);}
export function fileno(...args){return call("fileno",args);}
export function fmod(...args){return call("fmod",args);}
export function fmodf(...args){return call("fmodf",args);}
export function fopen(...args){return call("fopen",args);}
export function fprintf(...args){return call("fprintf",args);}
export function fputc(...args){return call("fputc",args);}
export function fputs(...args){return call("fputs",args);}
export function fread(...args){return call("fread",args);}
export function free(value){return freeSourceValue(value);}
export function freeaddrinfo(...args){return call("freeaddrinfo",args);}
export function freopen(...args){return call("freopen",args);}
export function fseek(...args){return call("fseek",args);}
export function fstat(...args){return call("fstat",args);}
export function ftell(...args){return call("ftell",args);}
export function fwrite(...args){return call("fwrite",args);}
export function getaddrinfo(...args){return call("getaddrinfo",args);}
export function getcwd(...args){return call("getcwd",args);}
export function getenv(...args){return call("getenv",args);}
export function gethostbyname(...args){return call("gethostbyname",args);}
export function gethostname(...args){return call("gethostname",args);}
export function getnameinfo(...args){return call("getnameinfo",args);}
export function getpid(...args){return call("getpid",args);}
export function getpwuid(...args){return call("getpwuid",args);}
export function getrusage(...args){return call("getrusage",args);}
export function gettimeofday(...args){return call("gettimeofday",args);}
export function getuid(...args){return call("getuid",args);}
export function inet_addr(...args){return call("inet_addr",args);}
export function inet_ntoa(...args){return call("inet_ntoa",args);}
export function inet_ntop(...args){return call("inet_ntop",args);}
export function inet_pton(...args){return call("inet_pton",args);}
export function isalnum(...args){return call("isalnum",args);}
export function isalpha(...args){return call("isalpha",args);}
export function isatty(...args){return call("isatty",args);}
export function isblank(...args){return call("isblank",args);}
export function iscntrl(...args){return call("iscntrl",args);}
export function isdigit(...args){return call("isdigit",args);}
export function isgraph(...args){return call("isgraph",args);}
export function islower(...args){return call("islower",args);}
export function isprint(...args){return call("isprint",args);}
export function ispunct(...args){return call("ispunct",args);}
export function isspace(...args){return call("isspace",args);}
export function isupper(...args){return call("isupper",args);}
export function isxdigit(...args){return call("isxdigit",args);}
export function kill(...args){return call("kill",args);}
export function ldexp(...args){return call("ldexp",args);}
export function ldexpf(...args){return call("ldexpf",args);}
export function listsearchpath(...args){return call("listsearchpath",args);}
export function lldiv(...args){return call("lldiv",args);}
export function llrintf(...args){return call("llrintf",args);}
export function localtime(...args){return call("localtime",args);}
export function localtime_r(...args){return call("localtime_r",args);}
export function log(...args){return call("log",args);}
export function log10f(...args){return call("log10f",args);}
export function logf(...args){return call("logf",args);}
export function lrint(...args){return call("lrint",args);}
export function lrintf(...args){return call("lrintf",args);}
export function lseek(...args){return call("lseek",args);}
export function madvise(...args){return call("madvise",args);}
export function malloc(...args){return call("malloc",args);}
export function memchr(...args){return call("memchr",args);}
export function memcmp(...args){return call("memcmp",args);}
export function memcpy(...args){return call("memcpy",args);}
export function memmove(...args){return call("memmove",args);}
export function memset(...args){return call("memset",args);}
export function mkdir(...args){return call("mkdir",args);}
export function mmap(...args){return call("mmap",args);}
export function mprotect(...args){return call("mprotect",args);}
export function munmap(...args){return call("munmap",args);}
export function nanosleep(...args){return call("nanosleep",args);}
export function open(...args){return call("open",args);}
export function opendir(...args){return call("opendir",args);}
export function openlog(...args){return call("openlog",args);}
export function perror(...args){return call("perror",args);}
export function poll(...args){return call("poll",args);}
export function pow(...args){return call("pow",args);}
export function powf(...args){return call("powf",args);}
export function prctl(...args){return call("prctl",args);}
export function printf(...args){return call("printf",args);}
export function pthread_getspecific(...args){return call("pthread_getspecific",args);}
export function pthread_key_create(...args){return call("pthread_key_create",args);}
export function pthread_key_delete(...args){return call("pthread_key_delete",args);}
export function pthread_mutex_destroy(...args){return call("pthread_mutex_destroy",args);}
export function pthread_mutex_init(...args){return call("pthread_mutex_init",args);}
export function pthread_mutex_lock(...args){return call("pthread_mutex_lock",args);}
export function pthread_mutex_trylock(...args){return call("pthread_mutex_trylock",args);}
export function pthread_mutex_unlock(...args){return call("pthread_mutex_unlock",args);}
export function pthread_once(...args){return call("pthread_once",args);}
export function pthread_self(...args){return call("pthread_self",args);}
export function pthread_setspecific(...args){return call("pthread_setspecific",args);}
export function puts(...args){return call("puts",args);}
export function qsort(...args){return call("qsort",args);}
export function raise(...args){return call("raise",args);}
export function rand(...args){return call("rand",args);}
export function read(...args){return call("read",args);}
export function readdir(...args){return call("readdir",args);}
export function realloc(...args){return call("realloc",args);}
export function realpath(...args){return call("realpath",args);}
export function removesearchpaths_withuser(...args){return call("removesearchpaths_withuser",args);}
export function sdlayer_checkversion(...args){return call("sdlayer_checkversion",args);}
export function setvbuf(...args){return call("setvbuf",args);}
export function sigaction(...args){return call("sigaction",args);}
export function sigemptyset(...args){return call("sigemptyset",args);}
export function signal(...args){return call("signal",args);}
export function sin(...args){return call("sin",args);}
export function sinf(...args){return call("sinf",args);}
export function snprintf(...args){return call("snprintf",args);}
export function sprintf(...args){return call("sprintf",args);}
export function sqrt(...args){return call("sqrt",args);}
export function sqrtf(...args){return call("sqrtf",args);}
export function srand(...args){return call("srand",args);}
export function sscanf(...args){return call("sscanf",args);}
export function stat(...args){return call("stat",args);}
export function strcasecmp(...args){return call("strcasecmp",args);}
export function strcat(...args){return call("strcat",args);}
export function strchr(...args){return call("strchr",args);}
export function strcmp(...args){return call("strcmp",args);}
export function strcpy(...args){return call("strcpy",args);}
export function strerror(...args){return call("strerror",args);}
export function strerror_r(...args){return call("strerror_r",args);}
export function strftime(...args){return call("strftime",args);}
export function strlen(...args){return call("strlen",args);}
export function strncasecmp(...args){return call("strncasecmp",args);}
export function strncat(...args){return call("strncat",args);}
export function strncmp(...args){return call("strncmp",args);}
export function strncpy(...args){return call("strncpy",args);}
export function strrchr(...args){return call("strrchr",args);}
export function strstr(...args){return call("strstr",args);}
export function strtod(...args){return call("strtod",args);}
export function strtol(...args){return call("strtol",args);}
export function strtoll(...args){return call("strtoll",args);}
export function strtoul(...args){return call("strtoul",args);}
export function strtoull(...args){return call("strtoull",args);}
export function sysReadCPUID(...args){return call("sysReadCPUID",args);}
export function syscall(...args){return call("syscall",args);}
export function sysconf(...args){return call("sysconf",args);}
export function syslog(...args){return call("syslog",args);}
export function tan(...args){return call("tan",args);}
export function tanf(...args){return call("tanf",args);}
export function testkopen(...args){return call("testkopen",args);}
export function time(...args){return call("time",args);}
export function timerInit(...args){return call("timerInit",args);}
export function tolower(...args){return call("tolower",args);}
export function toupper(...args){return call("toupper",args);}
export function unlink(...args){return call("unlink",args);}
export function vsnprintf(...args){return call("vsnprintf",args);}
export function wm_setapptitle(...args){return call("wm_setapptitle",args);}
export function write(...args){return call("write",args);}
