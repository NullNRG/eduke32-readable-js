"""A primary-unit macro refresh cannot reuse changed neighboring commands."""
import copy,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from refresh_semantic_unit import verify_command_delta
old=[{'file':'one.c','directory':'original','arguments':['clang','-x','c','-c','one.c']},{'file':'other.cpp','arguments':['clang++','-c','other.cpp']}]
new=copy.deepcopy(old);new[0]['arguments']+=['-DFAST=0']
before,after=verify_command_delta(old,new,'one.c');assert before==old[0] and after==new[0]
for kind in ('neighbor','target','language','directory','duplicate','removed','dangling'):
 changed=copy.deepcopy(new)
 if kind=='neighbor':changed[1]['arguments']+=['-DNEW=1']
 elif kind=='target':changed[0]['arguments']+=['--target=x86_64-windows-gnu']
 elif kind=='language':changed[0]['arguments'][2]='c++'
 elif kind=='directory':changed[0]['directory']='different'
 elif kind=='duplicate':changed.append(copy.deepcopy(changed[0]))
 elif kind=='removed':changed.pop()
 else:changed[0]['arguments']+=['-D']
 try:verify_command_delta(old,changed,'one.c')
 except ValueError:pass
 else:raise AssertionError('Unsafe semantic reuse: '+kind)
print('PASS: exactly one primary macro command can change; ABI/language/directory, neighboring units, incomplete and duplicate inventories stay rejected')
