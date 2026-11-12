"""Render original E1L1 room geometry; explicitly not app_main or gameplay.

Only original engine APIs load ART/MAP data and draw the indexed framebuffer.
Masked walls/sprites and game/CON initialization are separate acceptance gates.
"""
import ast,base64,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
probe=ROOT/'work/verify_original_map_load.py'
tree=ast.parse(probe.read_text())
art=ast.parse((ROOT/'work/verify_original_art_load.py').read_text())
art_blocks=[n for n in ast.walk(art) if isinstance(n,ast.Constant) and isinstance(n.value,str)
            and 'engineInitialization.art_oracle=' in n.value]
maps=[n for n in ast.walk(tree) if isinstance(n,ast.Constant) and isinstance(n.value,str)
      and 'let originalMap=null,mapOffset=' in n.value]
assert len(art_blocks)==len(maps)==1
maps[0].value=art_blocks[0].value+maps[0].value
maps[0].value+=r'''
      if(typeof engine.renderDrawRoomsQ16!=='function')throw Error('Original room renderer is not linked');
      const gameCommon=await import(base+'/source/duke3d/src/common.cpp.mjs');
      const tileNames=await import(base+'/source/duke3d/src/dnames.cpp.mjs');
      const skyTiles=['CLOUDYOCEAN','MOONSKY1','BIGORBIT1','LA'].map(name=>tileNames[name]);
      if(skyTiles.some(value=>!Number.isInteger(value)||value<=0))throw Error('Original sky tile globals are not initialized');
      await enter('original G_InitMultiPsky with original tile globals',()=>gameCommon.G_InitMultiPsky(...skyTiles));
      if(engine.pskynummultis!==5)throw Error('Original sky descriptors did not initialize');
      engineInitialization.original_game_sky_initialization_executed=true;
      const paletteRenderer=await import(base+'/source/build/src/palette.cpp.mjs');
      await enter('original videoSetPalette',()=>paletteRenderer.videoSetPalette(0,0,0));
      await enter('original videoSetViewableArea',()=>engine.videoSetViewableArea(0,0,engine.xdim-1,engine.ydim-1));
      const roomResult=await enter('original renderDrawRoomsQ16 E1L1 map start',()=>engine.renderDrawRoomsQ16(
        ...mapOutputPoint,mapOutputAngle[0]*65536,100*65536,mapOutputSector[0]));
      await enter('original videoShowFrame rooms',()=>videoPlatform.videoShowFrame(0));
      const canvas=document.querySelector('canvas'),rgba=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
      const colors=new Set();let visible=0;
      for(let p=0;p<rgba.length;p+=4){const color=(rgba[p]<<16)|(rgba[p+1]<<8)|rgba[p+2];colors.add(color);if(color)visible++;}
      if(colors.size<8||visible<1000)throw Error('Original room renderer produced no verified textured frame: '+JSON.stringify({colors:colors.size,visible}));
      engineInitialization.original_rooms_frame_rendered=true;
      engineInitialization.original_rooms_frame={result:roomResult,width:canvas.width,height:canvas.height,colors:colors.size,visible_pixels:visible};
      engineInitialization.rooms_only_capture_png=canvas.toDataURL('image/png');
'''
if '--report' not in sys.argv:sys.argv+=['--report','reports/nov12-original-rooms-frame.json']
report=ROOT/sys.argv[sys.argv.index('--report')+1]
screenshot=ROOT/'reports/evidence/nov12-original-js-rooms-only.png'
if '--screenshot' in sys.argv:
 index=sys.argv.index('--screenshot');screenshot=Path(sys.argv[index+1]).resolve();del sys.argv[index:index+2]
try:
 exec(compile(ast.fix_missing_locations(tree),str(probe),'exec'),{'__file__':str(probe),'__name__':'__main__'})
finally:
 if report.is_file():
  doc=json.loads(report.read_text());initialization=doc.get('engine_initialization') or {}
  encoded=initialization.pop('rooms_only_capture_png',None)
  if encoded and initialization.get('original_rooms_frame_rendered') and doc.get('component_passed'):
   pixels=base64.b64decode(encoded.split(',',1)[1]);screenshot.parent.mkdir(parents=True,exist_ok=True);screenshot.write_bytes(pixels)
   doc['original_rooms_capture']={'path':str(screenshot),'sha256':hashlib.sha256(pixels).hexdigest(),
      'caption':'Original JavaScript Build room renderer at original MAP start; no masked sprites, app_main, CON or gameplay verification'}
  doc['rooms_component_scope']={'original_app_main_executed':False,'original_CON_executed':False,
      'masked_walls_and_sprites_verified':False,'gameplay_verified':False}
  report.write_text(json.dumps(doc,indent=2)+'\n')
  profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text())
  (ROOT/profile['engine_execution_report']).write_text(json.dumps(doc,indent=2)+'\n')
