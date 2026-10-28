import base64,hashlib,json,os,shutil,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'factory-output/source-tree/eduke32-master';BUILD=SOURCE/'source/build/include';GAME=SOURCE/'source/duke3d/src'
def extract(text,end):
 stop=text.index(end)+len(end);start=text.rfind('typedef struct',0,stop);return text[start:stop]
def function(text,name):
 start=text.index(name);opening=text.index('{',start);level=1;end=opening+1
 while level:
  level+=(text[end]=='{')-(text[end]=='}');end+=1
 return text[start:end]
def run(args,cwd):
 p=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=180)
 assert p.returncode==0,(args,p.stdout[-1200:],p.stderr[-3500:]);return p.stdout.strip()
with tempfile.TemporaryDirectory(prefix='eduke-original-player-arrays-') as temp:
 root=Path(temp);out=root/'out'
 player=(GAME/'player.h').read_text();struct=extract(player,'} DukePlayer_t;');palette=extract((BUILD/'palette.h').read_text(),'} palette_t;')
 input_decl=extract(player,'} input_t;');playerdata_decl=extract(player,'} playerdata_t;')
 maxplayers=next(line for line in (BUILD/'build.h').read_text().splitlines() if line.startswith('#define MAXPLAYERS '))
 ammo=function((GAME/'player.cpp').read_text(),'void P_AddAmmo(');palfrom=function(player,'static inline void P_PalFrom(')
 (root/'original-player.h').write_text('#include "vec.h"\n#include "inv.h"\n'+maxplayers+'\n'+palette+'\ntypedef int32_t fix16_t;\n#define MAX_LOOGIES 6\n#pragma pack(push,1)\n'+input_decl+'\n'+struct+'\n'+playerdata_decl+'\n#pragma pack(pop)\nstatic_assert(sizeof(DukePlayer_t)==640,"original savegame ABI");\n')
 shutil.copyfile(BUILD/'vec.h',root/'vec.h');shutil.copyfile(GAME/'inv.h',root/'inv.h')
 (root/'unit.cpp').write_text('#include "original-player.h"\n#include <cstring>\n'+ammo+'\n'+palfrom+'''
 DukePlayer_t saved_players[2];
 int original_player_pointer_field(int n){
  playerdata_t players[2]={};DukePlayer_t a={},b={};a.pos.x=n;b.pos.x=n+71;
  players[1].ps=&a;DukePlayer_t **slot=&players[1].ps;*slot=&b;
  memcpy(&players[0].ps,&players[1].ps,sizeof(DukePlayer_t*));
  return players[0].ps->pos.x+players[1].ps->pos.x+1000*(slot==&players[1].ps)+10000*(players[1].ps==&b);
 }
 int original_player_case(int n){
  DukePlayer_t p={};p.pos.x=n*17;p.loogie[n%6].x=n-300;p.loogie[n%6].y=n+90;
  p.max_ammo_amount[n%MAX_WEAPONS]=200;p.ammo_amount[n%MAX_WEAPONS]=n%190;
  P_AddAmmo(&p,n%MAX_WEAPONS,n%50);P_PalFrom(&p,n,n+1,n+2,n+3);
  saved_players[1]=p;DukePlayer_t copy=p;copy.loogie[n%6].x++;
  unsigned sum=0;for(unsigned i=0;i<sizeof(p);i++)sum+=((unsigned char*)&p)[i];
  return p.ammo_amount[n%MAX_WEAPONS]+copy.loogie[n%6].x+saved_players[1].loogie[n%6].y+sum;
 }
 int original_player_copy(int n){
  DukePlayer_t p={};p.loogie[n%6].x=n-100;DukePlayer_t copy={};memcpy(&copy,&p,sizeof(p));
  vec2_16_t *row=p.loogie;row[n%6].y=n+3;
  return copy.loogie[n%6].x+p.loogie[n%6].y+1000*(row+n%6==&p.loogie[n%6]);
 }
 ''')
 (root/'main.cpp').write_text('#include <cstdio>\nextern int original_player_case(int),original_player_copy(int),original_player_pointer_field(int);int main(){for(int n=0;n<512;n++)printf("%d,%d,%d\\n",original_player_case(n),original_player_copy(n),original_player_pointer_field(n));}')
 flags=['-std=c++14','-funsigned-char','-DNOASM','-I'+str(BUILD),'-I'+str(root)]
 exe=root/'native.exe';run(['clang++',*flags,'unit.cpp','main.cpp','-o',str(exe)],root);expected=run([str(exe)],root).splitlines()
 commands=root/'commands.json';commands.write_text(json.dumps([{'file':'unit.cpp','arguments':['clang++',*flags,'-c','unit.cpp']}]))
 run([sys.executable,str(ROOT/'tools/source_ast_to_js.py'),'--root',str(root),'--source','unit.cpp','--compile-commands',str(commands),'--out-dir',str(out),'--header-dependency-closure'],root)
 module=out/'unit.cpp.mjs';mf=json.loads(module.with_suffix('.manifest.json').read_text())
 for name in ['P_AddAmmo','P_PalFrom','original_player_case','original_player_copy','saved_players','original_player_pointer_field']:
  row=next(r for r in mf['definitions'] if r['name']==name);assert row['status']=='source-first',row
 js='async url=>{const m=await import(url),rows=[];for(let n=0;n<512;n++)rows.push([m.original_player_case(n),m.original_player_copy(n),m.original_player_pointer_field(n)].join(","));return rows;}'
 (root/'driver.mjs').write_text('console.log((await ('+js+')('+json.dumps(module.as_uri())+')).join("\\n"));')
 actual=run(['node','driver.mjs'],root).splitlines();assert actual==expected,next(((i,a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a!=b),('length',len(actual),len(expected)))
 from playwright.sync_api import sync_playwright
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(executable_path=os.environ.get('EDUKE_CHROMIUM_EXECUTABLE'),headless=True)
  page=browser.new_page();actual=page.evaluate(js,'data:text/javascript;base64,'+base64.b64encode(module.read_bytes()).decode());assert actual==expected;version=browser.version;browser.close()
 report={'format':'original-eduke-player-storage-parity/1','passed':True,'gameplay_verified':False,'original_player_bytes':640,'native_js_values':1536,'native_chromium_values':1536,'browser_version':version,
  'original_source_hashes':{name:hashlib.sha256(text.encode()).hexdigest() for name,text in {'DukePlayer_t':struct,'playerdata_t':playerdata_decl,'input_t':input_decl,'P_AddAmmo':ammo,'P_PalFrom':palfrom}.items()},
  'checks':['unchanged original DukePlayer_t','640-byte original savegame layout','original loogie vector arrays','packed original playerdata_t pointer-field address and dereference','pointer-field memcpy across packed original player records','original ammo clamping','original palette mutation','whole-record native byte checksum','independent record copies','contiguous original vector array addresses'],
  'compiler_sha256':hashlib.sha256((ROOT/'tools/source_ast_to_js.py').read_bytes()).hexdigest()}
 (ROOT/'reports/oct16-original-player-pointer-field-parity.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
