/** glibc C-locale __ctype_b_loc/__ctype_toupper_loc pointer-to-pointer ABI.
 * The selected LLVM target is little-endian x86-64. This is the C locale,
 * NOT an arbitrary Unicode locale or a host glibc copy.
 */
export function createCLocaleABI({heap}={}){
  if(!heap)throw TypeError('C locale ABI requires heap');
  const flags={upper:0x100,lower:0x200,alpha:0x400,digit:0x800,xdigit:0x1000,
    space:0x2000,print:0x4000,graph:0x8000,blank:0x1,cntrl:0x2,punct:0x4,alnum:0x8};
  const classes=heap.calloc(384,2),upper=heap.calloc(384,4);
  for(let i=-128;i<256;i++){
    let v=0;
    const C=i>=0&&i<=255?i:-1;
    const AZ=C>=65&&C<=90,az=C>=97&&C<=122,digit=C>=48&&C<=57;
    const space=C===32||(C>=9&&C<=13);
    const graph=C>=33&&C<=126,print=C>=32&&C<=126;
    const xdigit=digit||(C>=65&&C<=70)||(C>=97&&C<=102);
    if(AZ)v|=flags.upper;if(az)v|=flags.lower;
    if(AZ||az)v|=flags.alpha;
    if(digit)v|=flags.digit;
    if(xdigit)v|=flags.xdigit;
    if(space)v|=flags.space;
    if(print)v|=flags.print;if(graph)v|=flags.graph;
    if(C===9||C===32)v|=flags.blank;
    if((C>=0&&C<32)||C===127)v|=flags.cntrl;
    if(graph&&!AZ&&!az&&!digit)v|=flags.punct;
    if(AZ||az||digit)v|=flags.alnum;
    heap.write(classes+(i+128)*2,'u16',v);
    const mapped=(C>=97&&C<=122)?C-32:(i<0&&i!==-1)?i+256:i;
    heap.write(upper+(i+128)*4,'i32',mapped);
  }
  const locClasses=heap.malloc(8),locUpper=heap.malloc(8);
  heap.write(locClasses,'u64',BigInt(classes+128*2));
  heap.write(locUpper,'u64',BigInt(upper+128*4));
  const character=value=>{
    const n=Number(value);
    if(!Number.isInteger(n)||n< -128||n>255)throw new RangeError('C locale character outside byte/EOF domain');
    return n;
  };
  const symbols={'__ctype_b_loc':()=>locClasses,'__ctype_toupper_loc':()=>locUpper};
  // C++ can reference the actual C functions instead of expanding glibc's
  // table macros. Both entry points must read the same selected locale data.
  for(const [name,mask] of Object.entries(flags))
    symbols['is'+name]=value=>heap.read(classes+(character(value)+128)*2,'u16')&mask;
  symbols.toupper=value=>heap.read(upper+(character(value)+128)*4,'i32');
  symbols.tolower=value=>{
    const n=character(value),c=n< -1?n+256:n;
    return c>=65&&c<=90?c+32:c;
  };
  return Object.freeze(symbols);
}
