from pathlib import Path
p=Path('work/debug_xxhash_compilation.py');s=p.read_text();s=s.replace('compiler.main()', '''prior=compiler.verified_libc_byte_symbol
sig=set()
def libc(d):
 if d.get('name')=='memcpy' and str(d.get('type')) not in sig:
  sig.add(str(d.get('type')));print('MEMCPY',d.get('type'),prior(d))
 return prior(d)
compiler.verified_libc_byte_symbol=libc
compiler.main()''');p.write_text(s)
