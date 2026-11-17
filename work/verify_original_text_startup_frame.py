"""Run complete original G_InitText in the source-engine/ART Chromium probe."""
import argparse,ast,base64,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--checkpoint',default='nov16',choices=('nov16','nov17'))
 stamp=parser.parse_args().checkpoint
 evidence=f'reports/evidence/{stamp}-original-text-startup.png'
 report_path=f'reports/{stamp}-original-text-startup-frame.json'
 oracle=json.loads((ROOT/'reports/nov16-native-original-font-oracle.json').read_text())
 path=ROOT/'work/verify_original_masked_frame.py';tree=ast.parse(path.read_text());arguments=sys.argv[:]
 try:
  sys.argv=['original-text-frame']
  for _ in range(4):
   stop=next(i for i,node in enumerate(tree.body) if isinstance(node,ast.Try))
   scope={'__file__':str(path),'__name__':'text_frame_extraction'}
   exec(compile(ast.fix_missing_locations(ast.Module(body=tree.body[:stop],type_ignores=[])),str(path),'exec'),scope)
   tree=scope['tree'];path=scope.get('source') or scope.get('probe') or scope.get('path')
 finally:sys.argv=arguments
 matches=0
 for node in ast.walk(tree):
  if not isinstance(node,ast.Constant) or not isinstance(node.value,str):continue
  if node.value.startswith('async ({base,consoleOnly})=>'):
   original_group="if(await enter('initgroupfile',()=>vfs.initgroupfile(filename))!==0||vfs.gnumfiles[0]!==456)throw Error('Original archive initialization failed');"
   assert node.value.count(original_group)==1
   node.value=node.value.replace(original_group,r'''
      const originalResourceCommon=await enter('import original resource initialization',()=>import(base+'/source/duke3d/src/common.cpp.mjs'));
      await enter('original G_ScanGroups',()=>originalResourceCommon.G_ScanGroups());
      if(!originalResourceCommon.g_selectedGrp)throw Error('Original source did not recognize/select supplied GRP');
      await enter('original G_LoadGroups',()=>originalResourceCommon.G_LoadGroups(0));
      if(vfs.numgroupfiles!==1||vfs.gnumfiles[0]!==456)throw Error('Original G_LoadGroups did not index supplied archive');
''')
   marker="      const canvas=document.querySelector('canvas'),rgba=";assert node.value.count(marker)==1
   injected=r'''
      const oracle=ORACLE;
      const font=await enter('import original font functions',()=>import(base+'/source/build/src/screentext.cpp.mjs'));
      const text=await enter('import original text initialization',()=>import(base+'/source/duke3d/src/text.cpp.mjs'));
      const rows=[Number(font.tilefontFind(65000).opaque===null)],buffers=[],lowercase=[];
      const addressSpace=globalThis[Symbol.for('source-lp64-addresses/2')];
      for(let stage=0;stage<2;stage++){
        if(stage)font.tilefontDefineMapping(font.tilefontFind(oracle.font_ids[0]),65,9999);
        await enter('original G_InitText stage '+stage,()=>text.G_InitText());
        const originalBuffer=sourceSizedBytes(text.g_screentextbuf,Number(text.g_screentextbufcount)*oracle.layout.glyph_size,runtime.heap);
        if(originalBuffer.buffer!==runtime.heap.buffer||originalBuffer.byteLength!==512)throw Error('Original glyph buffer is not the native allocated span');
        buffers.push({address:originalBuffer.byteOffset,bytes:originalBuffer.byteLength});
        for(const id of oracle.font_ids){
          const pointer=font.tilefontFind(id);if(pointer.opaque===null)throw Error('Original G_InitText did not create font '+id);
          rows.push(Number(addressSpace.encode(pointer.opaque)===addressSpace.encode(font.tilefontGetPtr(id).opaque)));
          for(let code=0;code<256;code++)rows.push(Number(font.tilefontLookup(pointer,code)));
        }
      }
      if(buffers[0].address===buffers[1].address)throw Error('Original repeated allocation unexpectedly reused live glyph storage');
      if(JSON.stringify(rows)!==JSON.stringify(oracle.values)){
        const first=rows.findIndex((v,i)=>v!==oracle.values[i]);throw Error('Original font table differs from native statements at '+first+': '+rows[first]+' vs '+oracle.values[first]);
      }
      const sourceByteHelpers=await import(new URL('../../../../runtime/source_bytes.mjs',new URL(base+'/',location.href)));
      font.tilefontDefineMapping(font.tilefontFind(oracle.font_ids[0]),0xa9c3,4500);
      let parserCases=0;
      for(const item of oracle.native_parser_cases){
        const input=new TextEncoder().encode(item.text+'\0'),end=sourceByteHelpers.sourceByteOffset(input,input.length-1);
        const glyphs=new Uint16Array(256);glyphs.fill(0xa5a5);
        const count=Number(text.G_ScreenTextFromString(glyphs,input,end,font.tilefontFind(item.font),item.font,item.flags));
        const actual=Array.from(glyphs.subarray(0,count+1));
        if(count!==item.count||JSON.stringify(actual)!==JSON.stringify(item.glyphs)||glyphs[count+1]!==0xa5a5)
          throw Error('Original text parser differs from native: '+JSON.stringify({item,count,actual}));
        parserCases++;
      }
      engineInitialization.original_text_startup={original_full_G_InitText_executed:true,original_font_services_executed:true,
        initialization_calls:2,native_mapping_entries:oracle.compared_font_entries,native_pointer_identity_checks:6,
        glyph_buffers:buffers,native_original_text_parser_cases:parserCases,native_oracle_scope:oracle.oracle_scope,original_game_menu_rendered:false,gameplay_verified:false};
      engineInitialization.original_resource_group_loading={original_G_ScanGroups_executed:true,original_G_LoadGroups_executed:true,
        original_group_selected:true,archive_entries:Number(vfs.gnumfiles[0]),archive_count:Number(vfs.numgroupfiles),autoload_requested:false,
        original_app_main_executed:false,gameplay_verified:false};
'''.replace('ORACLE',json.dumps(oracle,separators=(',',':')))
   node.value=node.value.replace(marker,injected+marker);matches+=1
  elif node.value=='reports/nov12-original-masked-frame.json':node.value=report_path
  elif node.value=='reports/evidence/nov12-original-js-engine-masks.png':node.value=evidence
 assert matches==1
 report=ROOT/report_path;sys.argv=['original-text-frame','--report',str(report)]
 try:exec(compile(ast.fix_missing_locations(tree),str(path),'exec'),{'__file__':str(path),'__name__':'__main__'})
 finally:
  if report.is_file():
   doc=json.loads(report.read_text());initialization=doc.get('engine_initialization') or {};encoded=initialization.pop('rooms_only_capture_png',None)
   if encoded:
    pixels=base64.b64decode(encoded.split(',',1)[1]);image=ROOT/evidence;image.write_bytes(pixels)
    doc['original_rooms_capture']={'path':evidence,'sha256':hashlib.sha256(pixels).hexdigest(),'caption':'Original raw MAP engine frame with original font initialization executed; no game menu, app_main or gameplay'}
   doc['native_font_oracle']='reports/nov16-native-original-font-oracle.json';doc['gameplay_verified']=False
   report.write_text(json.dumps(doc,indent=2)+'\n')
   assert doc.get('component_passed') and initialization.get('original_text_startup',{}).get('original_full_G_InitText_executed'),doc.get('error',doc.get('page_errors'))
if __name__=='__main__':main()
