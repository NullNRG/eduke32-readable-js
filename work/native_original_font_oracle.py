"""Native oracle for exact original font services and G_InitText mapping statements.

This deliberately does not replace tileLoad or claim native parity for resource
loading/allocation. The browser probe executes the entire original G_InitText;
the native oracle executes its exact mapping-statement suffix only.
"""
import hashlib,json,sqlite3,subprocess,tempfile
from pathlib import Path
from verify_original_animation_init import ROOT,SOURCE,run

def prepare():
 fonts=SOURCE/'source/build/src/screentext.cpp';text=SOURCE/'source/duke3d/src/text.cpp'
 f=fonts.read_text();t=text.read_text()
 first=f.index('using tilefont_map_t =');last=f.index('struct LocaleCharWrapper_t',first)
 start=t.index('void G_InitText()');end=t.index('\n}\n',start)+3
 statements=t.index('    TileFontPtr_t tilefont_BIGALPHANUM',start)
 exact_fonts=f[first:last];exact_statements=t[statements:end]
 parser_start=t.index('static int32_t G_GetStringTileLegacy(')
 parser_end=t.index('void G_SetScreenTextEmpty(',parser_start)
 exact_parser=t[parser_start:parser_end]
 # Retain original variable definitions by stable native declaration extents.
 # Linking the entire native dnames TU retains unrelated unresolved game APIs
 # under this host linker, even with section GC; no values are substituted.
 names=('BIGALPHANUM','BIGPERIOD','BIGCOMMA','BIGX_','BIGQ','BIGSEMI','BIGCOLIN','BIGAPPOS','STARTALPHANUM','MINIFONT')
 data=(SOURCE/'source/duke3d/src/dnames.cpp').read_bytes();definitions=[];provenance=[]
 with sqlite3.connect(ROOT/'factory-output/source-first/browser-classic/reports/semantic-index.sqlite') as db:
  for name in names:
   records=[json.loads(row[0]) for row in db.execute('SELECT record FROM declarations WHERE name=? AND definition=1',(name,))]
   records=[r for r in records if r['file']=='source/duke3d/src/dnames.cpp' and r['kind']=='VAR_DECL']
   assert len(records)==1,(name,len(records));record=records[0];begin,finish=record['definition_extent']
   assert data[record['offset']:record['offset']+len(name)]==name.encode() and data[finish:finish+1]==b';'
   literal=data[begin:finish+1];definitions.append((begin,literal.decode()))
   provenance.append({'name':name,'usr':record['usr'],'extent':[begin,finish+1],'sha256':hashlib.sha256(literal).hexdigest()})
 with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='native-original-fonts-') as directory:
  folder=Path(directory)
  (folder/'original-fonts.cpp').write_text(exact_fonts)
  (folder/'original-font-variables.cpp').write_text('\n'.join(value for _,value in sorted(definitions)))
  (folder/'original-mappings.cpp').write_text('void OriginalMappingStatements()\n{\n'+exact_statements)
  (folder/'original-parser.cpp').write_text(exact_parser)
  (folder/'oracle.cpp').write_text(r'''#include <cstdio>
#include <cstddef>
#include <unordered_map>
#include "duke3d.h"
#include "screentext.h"
#include "original-font-variables.cpp"
#include "original-fonts.cpp"
#include "original-mappings.cpp"
#include "original-parser.cpp"
int main(){
 printf("%zu %zu %zu\n",sizeof(TileFontPtr_t),offsetof(TileFontPtr_t,opaque),sizeof(ScreenTextGlyph_t));
 int fonts[]={BIGALPHANUM,STARTALPHANUM,MINIFONT};
 printf("%d %d %d\n",fonts[0],fonts[1],fonts[2]);
 printf("%d\n",tilefontFind(65000).opaque==nullptr);
 OriginalMappingStatements();
 for(int stage=0;stage<2;stage++){
  if(stage){tilefontDefineMapping(tilefontGetPtr(fonts[0]),tilefontGetChr32FromASCII('A'),9999);OriginalMappingStatements();}
  for(int font:fonts){auto p=tilefontGetPtr(font);printf("%d\n",p.opaque==tilefontFind(font).opaque);
   for(int c=0;c<256;c++)printf("%u\n",unsigned(tilefontLookup(p,tilefontGetChr32FromASCII((char)c))));
  }
 }
 tilefontDefineMapping(tilefontFind(fonts[0]),0xa9c3,4500);
 char const * strings[]={"DUKE NUKEM 3D","^12Duke ^3A","\t1\nHello!","A\xc3\xa9",""};
 int flags[]={0,TEXT_UPPERCASE,TEXT_INVERTCASE,TEXT_CONSTWIDTHNUMS,TEXT_LITERALESCAPE,TEXT_IGNOREESCAPE,TEXT_UPPERCASE|TEXT_INVERTCASE};
 for(int font:fonts)for(int flag:flags)for(unsigned input=0;input<5;input++){
  ScreenTextGlyph_t glyphs[256]={};auto str=strings[input];
  auto count=G_ScreenTextFromString(glyphs,str,str+strlen(str),tilefontFind(font),font,flag);
  printf("%d %d %u %u",font,flag,input,count);
  for(unsigned i=0;i<=count;i++)printf(" %u",unsigned(glyphs[i]));printf("\n");
 }
}
''')
  flags=['-std=gnu++14','-funsigned-char','-O2','-flto','-ffunction-sections','-fdata-sections','-include','cstdlib','-DNOASM','-DNDEBUG','-DSDL_TARGET=2','-DRENDERTYPESDL=1','-DNETCODE_DISABLE','-DEDUKE32_BROWSER=1']
  flags+=['-I'+str(SOURCE/p) for p in ('source/build/include','source/duke3d/src','source/audiolib/include','source/mact/include','source/glad/include','platform/Windows/include','platform/Windows/include/SDL2')]
  exe=folder/'oracle.exe'
  run(['clang++',*flags,folder/'oracle.cpp','-Wl,--gc-sections','-o',exe])
  output=run([exe]);lines=output.splitlines();layout=dict(zip(('pointer_size','opaque_offset','glyph_size'),map(int,lines[0].split())));ids=list(map(int,lines[1].split()));limit=2+1+2*3*257;values=list(map(int,lines[2:limit]))
  strings=['DUKE NUKEM 3D','^12Duke ^3A','\t1\nHello!','A\u00e9',''];parsers=[]
  for line in lines[limit:]:
   font,flag,index,count,*glyphs=map(int,line.split());assert len(glyphs)==count+1
   parsers.append({'font':font,'flags':flag,'text':strings[index],'count':count,'glyphs':glyphs})
  assert len(parsers)==105
  assert len(ids)==3 and len(values)==1+2*3*257
  expected={'layout':layout,'font_ids':ids,'values':values,'compared_font_entries':2*3*256,
   'oracle_scope':'Exact original font functions and exact G_InitText mapping statements; excludes native allocation, tileLoad and complete game parity',
   'original_font_source_sha256':hashlib.sha256(fonts.read_bytes()).hexdigest(),'original_text_source_sha256':hashlib.sha256(text.read_bytes()).hexdigest(),
   'font_definition_slice_sha256':hashlib.sha256(exact_fonts.encode()).hexdigest(),'mapping_statement_slice_sha256':hashlib.sha256(exact_statements.encode()).hexdigest(),
   'mapping_statement_source_line':t[:statements].count('\n')+1,'native_output_sha256':hashlib.sha256(output.encode()).hexdigest(),
   'source_inputs_modified':False,'native_tileLoad_stub_used':False,'native_full_G_InitText_executed':False,'gameplay_verified':False}
  expected['original_variable_definitions']=provenance
  expected['original_parser_definition_sha256']=hashlib.sha256(exact_parser.encode()).hexdigest()
  expected['native_parser_cases']=parsers
  expected['original_dnames_source_sha256']=hashlib.sha256(data).hexdigest()
  (ROOT/'reports/nov16-native-original-font-oracle.json').write_text(json.dumps(expected,indent=2)+'\n')
  (ROOT/'reports/nov16-native-original-font-oracle.log').write_text(output)
  return expected
if __name__=='__main__':
 result=prepare();print(json.dumps({k:v for k,v in result.items() if k!='values'},indent=2))
