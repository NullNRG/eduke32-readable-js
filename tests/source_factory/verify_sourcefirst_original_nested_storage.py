"""Native differential test of unchanged original actor/projectile/spawn types."""
from pathlib import Path
from contextlib import nullcontext
import hashlib,json,os,re,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'factory-output/source-tree/eduke32-master'
def run(args,cwd,timeout=160):
 result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=timeout)
 assert result.returncode==0,(args,result.stdout[-1000:],result.stderr[-3000:])
 return result.stdout
actors=(SOURCE/'source/duke3d/src/actors.h').read_text()
players=(SOURCE/'source/duke3d/src/player.h').read_text()
game=(SOURCE/'source/duke3d/src/game.h').read_text()
def original_typedef(text,name):
 end=text.index('} '+name+';')+len('} '+name+';')
 start=text.rfind('typedef struct',0,end)
 value=text[start:end]
 assert value.startswith('typedef struct') and value.endswith('} '+name+';')
 return value
types='\n'.join(original_typedef(text,name) for text,name in (
 (actors,'actor_t'),(players,'projectile_t'),(players,'playerspawn_t')))
user_types='\n'.join(original_typedef(game,name) for name in ('ud_setup_t','user_defs'))
user_defines=game[game.index('#define MAXRIDECULE '):game.index('typedef struct ud_setup_s')]
control=(SOURCE/'source/mact/include/control.h').read_text()
user_defines+=re.search(r'^#define MAXMOUSEBUTTONS\s+.+$',control,re.M)[0]+'\n'
fixed=os.environ.get('EDUKE32_NESTED_STORAGE_TEST_DIR')
with (nullcontext(fixed) if fixed else tempfile.TemporaryDirectory(prefix='eduke-original-nested-')) as scratch:
 tmp=Path(scratch)
 tmp.mkdir(parents=True,exist_ok=True)
 # vec.h is included unchanged. The three typedef excerpts are verbatim
 # original declarations, including overlapping original vector subobjects.
 unit='#include "vec.h"\n#include "fix16.h"\n#include "gamedefs.h"\n#include "function.h"\n#include "inv.h"\n'+user_defines+'\n'+user_types+'\n#pragma pack(push,1)\n'+types+'\n#pragma pack(pop)\n'+r'''
typedef projectile_t ProjectileAlias;
actor_t entities[8];
projectile_t projectiles[4];
playerspawn_t starts[6];
user_defs options;
extern "C" int zero_state(){
 int total=0;
 for(int i=0;i<8;i++)total+=entities[i].bpos.x+entities[i].bpos.xy.y+entities[i].t_data[3];
 for(int i=0;i<4;i++)total+=projectiles[i].workslike+projectiles[i].filler[0];
 for(int i=0;i<6;i++)total+=starts[i].x+starts[i].xyz.y+starts[i].ang;
 return total;
}
extern "C" int mutate(int i){
 int a=i%8,b=i%4,c=i%6;
 entities[a].bpos.x=i*101-13000;
 entities[a].bpos.xy.y=i*13-4000;
 entities[a].bpos.v=i*7;
 entities[a].lastv.x=i*5;
 entities[a].t_data[3]=i*11;
 entities[a].floorzoffset=(int8_t)(i-200);
 starts[c].xyz.x=i*17;
 starts[c].xy.y=i*19;
 starts[c].z=i*23;
 starts[c].ang=(int16_t)(i*997);
 projectiles[b].filler[0]=(int8_t)(i-150);
 projectiles[b].shade=(int8_t)(i-199);
 projectiles[b].workslike=i*29;
 return entities[a].bpos.d+entities[a].bpos.y+entities[a].bpos.z+entities[a].lastv.x
  +entities[(a+1)%8].t_data[3]+entities[a].floorzoffset
  +starts[c].x+starts[c].xyz.y+starts[c].xyz.z+starts[c].ang
  +projectiles[b].filler[0]+projectiles[b].shade+projectiles[(b+1)%4].workslike;
}
extern "C" int copy_state(int i){
 int a=i%8,c=i%6;
 actor_t snapshot=entities[a];
 snapshot.bpos.x+=300;
 snapshot.t_data[3]+=50;
 starts[(c+1)%6]=starts[c];
 starts[(c+1)%6].xy.x+=123;
 return snapshot.bpos.d+entities[a].bpos.x+snapshot.t_data[3]+entities[a].t_data[3]
  +starts[(c+1)%6].xyz.x+starts[c].x;
}
extern "C" int original_sizes(){return sizeof(actor_t)+sizeof(projectile_t)+sizeof(playerspawn_t);}
extern "C" int user_state(int i){
 options.camerapos.xy.x=i*3;
 options.camerapos.z=i*5;
 options.config.MouseFunctions[i%MAXMOUSEBUTTONS][i%2]=i*7;
 options.config.KeyboardKeys[i%NUMGAMEFUNCTIONS][i%2]=(uint8_t)i;
 options.setup.xdim=i+320;
 options.ridecule[i%MAXRIDECULE][i%MAXRIDECULELENGTH]=(char)('A'+i%26);
 options.returnvar[1]=i*11;
 options.menutitle_pal=(int8_t)(i-200);
 return options.camerapos.x+options.camerapos.z+options.config.MouseFunctions[i%MAXMOUSEBUTTONS][i%2]
  +options.config.KeyboardKeys[i%NUMGAMEFUNCTIONS][i%2]+options.setup.xdim
  +options.ridecule[i%MAXRIDECULE][i%MAXRIDECULELENGTH]+options.returnvar[1]+options.menutitle_pal;
}
'''
 (tmp/'unit.cpp').write_text(unit)
 (tmp/'main.cpp').write_text(r'''#include <cstdio>
extern "C" int zero_state(),mutate(int),copy_state(int),original_sizes(),user_state(int);
int main(){printf("%d,%d\n",zero_state(),original_sizes());
for(int i=0;i<512;i++){int a=mutate(i),b=copy_state(i),c=user_state(i);printf("%d,%d,%d\n",a,b,c);}}
''')
 native=tmp/('native.exe' if os.name=='nt' else 'native')
 includes=['-I'+str(SOURCE/'source/build/include'),'-I'+str(SOURCE/'source/mact/include'),
           '-I'+str(SOURCE/'source/audiolib/include'),'-I'+str(SOURCE/'source/duke3d/src')]
 run(['clang++','-std=c++14','-funsigned-char','-DNOASM',*includes,'unit.cpp','main.cpp','-o',str(native)],tmp)
 expected=run([str(native)],tmp).splitlines()
 (tmp/'commands.json').write_text(json.dumps([{'file':'unit.cpp',
  'arguments':['clang++','-std=c++14','-funsigned-char','-DNOASM',*includes,'-c','unit.cpp']}]))
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(tmp),'--source','unit.cpp',
      '--compile-commands',str(tmp/'commands.json'),
      '--out-dir',str(tmp/'generated')],tmp)
 module=tmp/'generated/unit.cpp.mjs'
 manifest=json.loads(module.with_suffix('.manifest.json').read_text())
 rows={d.get('source_name',d['name']):d for d in manifest['definitions']}
 for name in ('entities','projectiles','starts','options','zero_state','mutate','copy_state','original_sizes','user_state'):
  assert rows[name]['status']=='source-first',(name,rows[name])
 run(['node','--check',str(module)],tmp)
 (tmp/'run.mjs').write_text('import * as s from '+json.dumps(module.as_uri())+';\n'
  +'console.log(`${s.zero_state()},${s.original_sizes()}`);\n'
  +'for(let i=0;i<512;i++)console.log(`${s.mutate(i)},${s.copy_state(i)},${s.user_state(i)}`);\n')
 observed=run(['node','run.mjs'],tmp).splitlines()
 assert observed==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(observed,expected)) if a!=b),None)
 print('PASS 1538 original native C++/JS values: actor/projectile/spawn/user_defs zero storage, nested vector/union aliasing, named anonymous records, signed bytes, independent aggregate copies; original declarations SHA256 '+hashlib.sha256((types+user_types+user_defines).encode()).hexdigest())
