"""Source-first cross-TU linker: atomic commit, no fabricated providers."""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_global_link import settle_proposals,declared_ownership

def unit(source, statuses, imports=()):
    defs=[{'name':name,'status':status,'reason':reason}
          for name,status,reason in statuses]
    return {'manifest':{'source':source,'definitions':defs,'imports':list(imports)},'module':None}

def dep(name,source):return {'name':name,'from':source}

# Two original C functions can be mutually recursive across source units.
orig={
 'a.cpp':unit('a.cpp',[('A','blocked','unlinked identifiers: B')]),
 'b.cpp':unit('b.cpp',[('B','blocked','unlinked identifiers: A')]),
}
known,amb=declared_ownership(orig)
assert known=={'A':'a.cpp','B':'b.cpp'} and not amb
new={
 'a.cpp':unit('a.cpp',[('A','source-first','')],[dep('B','b.cpp')]),
 'b.cpp':unit('b.cpp',[('B','source-first','')],[dep('A','a.cpp')]),
}
accepted,rejected=settle_proposals(orig,new)
assert set(accepted)==set(new) and not rejected,(accepted,rejected)

# A lone importer must NOT claim its unavailable provider is linked.
accepted,rejected=settle_proposals(orig,{'a.cpp':new['a.cpp']})
assert not accepted and 'a.cpp' in rejected

# One invalid provider removes all consumers transitively.
three={**orig,'c.cpp':unit('c.cpp',[('C','blocked','unlinked identifiers: A')])}
proposed={**new,'c.cpp':unit('c.cpp',[('C','source-first','')],[dep('A','a.cpp')])}
proposed['b.cpp']=unit('b.cpp',[('B','blocked','CXXOperatorCallExpr')])
accepted,rejected=settle_proposals(three,proposed)
assert {'a.cpp','c.cpp'}<=set(rejected) and not set(accepted).intersection({'a.cpp','c.cpp'})

# Ambiguous ownership of a source name prevents a false import.
ambiguous={
 'one.cpp':unit('one.cpp',[('VALUE','blocked','unlinked identifiers: something')]),
 'two.cpp':unit('two.cpp',[('VALUE','blocked','unlinked identifiers: something_else')]),
}
known,amb=declared_ownership(ambiguous)
assert 'VALUE' not in known and set(amb['VALUE'])=={'one.cpp','two.cpp'}
print('PASS: cross-unit cyclic ownership, atomic proposal validation, cascading rejection and ambiguous source owners')
