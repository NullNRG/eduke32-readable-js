/** libstdc++ x86-64 GNU _Prime_rehash_policy ABI.
 * 305 actual growth primes extracted from the host's GNU libstdc++ ABI,
 * independent of game content. Used as the standard library's bucket policy.
 */
const PRIMES = [
  1n, 2n, 3n, 5n, 7n, 11n, 13n, 17n,
  19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n,
  53n, 59n, 61n, 67n, 71n, 73n, 79n, 83n,
  89n, 97n, 103n, 109n, 113n, 127n, 137n, 139n,
  149n, 157n, 167n, 179n, 193n, 199n, 211n, 227n,
  241n, 257n, 277n, 293n, 313n, 337n, 359n, 383n,
  409n, 439n, 467n, 503n, 541n, 577n, 619n, 661n,
  709n, 761n, 823n, 887n, 953n, 1031n, 1109n, 1193n,
  1289n, 1381n, 1493n, 1613n, 1741n, 1879n, 2029n, 2179n,
  2357n, 2549n, 2753n, 2971n, 3209n, 3469n, 3739n, 4027n,
  4349n, 4703n, 5087n, 5503n, 5953n, 6427n, 6949n, 7517n,
  8123n, 8783n, 9497n, 10273n, 11113n, 12011n, 12983n, 14033n,
  15173n, 16411n, 17749n, 19183n, 20753n, 22447n, 24281n, 26267n,
  28411n, 30727n, 33223n, 35933n, 38873n, 42043n, 45481n, 49201n,
  53201n, 57557n, 62233n, 67307n, 72817n, 78779n, 85229n, 92203n,
  99733n, 107897n, 116731n, 126271n, 136607n, 147793n, 159871n, 172933n,
  187091n, 202409n, 218971n, 236897n, 256279n, 277261n, 299951n, 324503n,
  351061n, 379787n, 410857n, 444487n, 480881n, 520241n, 562841n, 608903n,
  658753n, 712697n, 771049n, 834181n, 902483n, 976369n, 1056323n, 1142821n,
  1236397n, 1337629n, 1447153n, 1565659n, 1693859n, 1832561n, 1982627n, 2144977n,
  2320627n, 2510653n, 2716249n, 2938679n, 3179303n, 3439651n, 3721303n, 4026031n,
  4355707n, 4712381n, 5098259n, 5515729n, 5967347n, 6456007n, 6984629n, 7556579n,
  8175383n, 8844859n, 9569143n, 10352717n, 11200489n, 12117689n, 13109983n, 14183539n,
  15345007n, 16601593n, 17961079n, 19431899n, 21023161n, 22744717n, 24607243n, 26622317n,
  28802401n, 31160981n, 33712729n, 36473443n, 39460231n, 42691603n, 46187573n, 49969847n,
  54061849n, 58488943n, 63278561n, 68460391n, 74066549n, 80131819n, 86693767n, 93793069n,
  101473717n, 109783337n, 118773397n, 128499677n, 139022417n, 150406843n, 162723577n, 176048909n,
  190465427n, 206062531n, 222936881n, 241193053n, 260944219n, 282312799n, 305431229n, 330442829n,
  357502601n, 386778277n, 418451333n, 452718089n, 489790921n, 529899637n, 573292817n, 620239453n,
  671030513n, 725980837n, 785430967n, 849749479n, 919334987n, 994618837n, 1076067617n, 1164186217n,
  1259520799n, 1362662261n, 1474249943n, 1594975441n, 1725587117n, 1866894511n, 2019773507n, 2185171673n,
  2364114217n, 2557710269n, 2767159799n, 2993761039n, 3238918481n, 3504151727n, 3791104843n, 4101556399n,
  4294967291n, 6442450933n, 8589934583n, 12884901857n, 17179869143n, 25769803693n, 34359738337n, 51539607367n,
  68719476731n, 103079215087n, 137438953447n, 206158430123n, 274877906899n, 412316860387n, 549755813881n, 824633720731n,
  1099511627689n, 1649267441579n, 2199023255531n, 3298534883309n, 4398046511093n, 6597069766607n, 8796093022151n, 13194139533241n,
  17592186044399n, 26388279066581n, 35184372088777n, 52776558133177n, 70368744177643n, 105553116266399n, 140737488355213n, 211106232532861n,
  281474976710597n, 562949953421231n, 1125899906842597n, 2251799813685119n, 4503599627370449n, 9007199254740881n, 18014398509481951n, 36028797018963913n,
  72057594037927931n, 144115188075855859n, 288230376151711717n, 576460752303423433n, 1152921504606846883n, 2305843009213693951n, 4611686018427387847n, 9223372036854775783n,
  18446744073709551557n];
export function createCxxHashtableABI({heap}={}) {
  if(!heap)throw TypeError('GNU hash policy requires heap');
  const number=x=>{const n=Number(x);if(!Number.isSafeInteger(n)||n<0)throw RangeError('size_t outside safe JS integer range');return n;};
  function nextBucket(self,n){
    const requested=BigInt(n);if(requested<0n)throw RangeError('negative bucket count');
    if(requested===0n)return 1n;
    if(requested===1n)return nextBucket(self,2n);
    let low=0,high=PRIMES.length;
    while(low<high){const m=(low+high)>>>1;if(PRIMES[m]<requested)low=m+1;else high=m;}
    if(low>=PRIMES.length)throw RangeError('Unsupported libstdc++ prime growth');
    const result=PRIMES[low];
    const load=heap.read(self,'f32');
    if(!(load>0)||!Number.isFinite(load))throw RangeError('Invalid unordered_map load factor');
    if(result===PRIMES[PRIMES.length-1])heap.write(self+8,'u64',0xffffffffffffffffn);
    else heap.write(self+8,'u64',BigInt(Math.floor(number(result)*load)));
    return result;
  }
  return Object.freeze({
    _ZNKSt8__detail20_Prime_rehash_policy11_M_next_bktEm:nextBucket,
    _ZNKSt8__detail20_Prime_rehash_policy14_M_need_rehashEmmm:(self,buckets,elements,insertions)=>{
      const old=heap.read(self+8,'u64');
      const n=BigInt(elements)+BigInt(insertions),bn=BigInt(buckets);
      if(n<=old)return [0,0n];
      const factor=heap.read(self,'f32');
      if(!(factor>0)||!Number.isFinite(factor))throw RangeError('Invalid unordered_map load factor');
      const min=Math.max(number(n),old===0n?11:0)/factor;
      if(min>=number(bn)){
        const candidate=BigInt(Math.max(Math.floor(min)+1,number(bn)*2));
        return [1,nextBucket(self,candidate)];
      }
      heap.write(self+8,'u64',BigInt(Math.floor(number(bn)*factor)));
      return [0,0n];
    },
  });
}
