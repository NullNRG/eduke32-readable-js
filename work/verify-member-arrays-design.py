import json,subprocess
from pathlib import Path
root=Path('work').resolve();module=root/'member-arrays-after/member-arrays-unit.cpp.mjs'
(root/'member-arrays-main.cpp').write_text('#include <cstdio>\n#include "member-arrays-unit.cpp"\nint main(){for(int n=0;n<512;n++)printf("%d,%d,%d,%d\\n",member_arrays(n),member_array_bytes(n),member_array_init(n),global_member_array(n));}')
(root/'member-arrays-driver.mjs').write_text('import * as m from '+json.dumps(module.as_uri())+';for(let n=0;n<512;n++)console.log([m.member_arrays(n),m.member_array_bytes(n),m.member_array_init(n),m.global_member_array(n)].join(","));')
def run(cmd):
 p=subprocess.run(cmd,cwd=root,capture_output=True,text=True);print(cmd[0],p.returncode,p.stderr[-1700:]);return p.stdout.splitlines()
run(['clang++','-std=c++14','member-arrays-main.cpp','-o','member-arrays-native.exe'])
a=run([str(root/'member-arrays-native.exe')]);b=run(['node','member-arrays-driver.mjs']);print('lengths',len(a),len(b));print('first mismatch',next(((i,x,y) for i,(x,y) in enumerate(zip(a,b)) if x!=y),None));print(a[:2],b[:2])
