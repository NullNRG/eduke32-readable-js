"""Run original engineInit with a raw GRP; this is not app_main/gameplay."""
import ast,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from browser_engine_probe import fresh_engine_probe
path=ROOT/'tools/verify_browser_engine_component.py';tree=ast.parse(path.read_text())
scripts=[n for n in ast.walk(tree) if isinstance(n,ast.Constant) and isinstance(n.value,str) and n.value.startswith('async ({base,consoleOnly})=>')]
assert len(scripts)==1
script=fresh_engine_probe(ROOT).replace('memoryBytes:16<<20','memoryBytes:128<<20')
anchor="if(startupResult!==0)throw Error('Original enginePreInit failed: '+startupResult);"
assert script.count(anchor)==1
setup=r'''
      const response=await fetch('/input-data/DUKE3D.GRP');if(!response.ok)throw Error('Supplied GRP unavailable');
      const archive=new Uint8Array(await response.arrayBuffer());runtime.fs.mountBytes('DUKE3D.GRP',archive);
      const vfs=await enter('import original VFS',()=>import(base+'/source/build/src/vfs.cpp.mjs'));
      const filename=Uint8Array.from([...new TextEncoder().encode('DUKE3D.GRP'),0]);
      if(await enter('initgroupfile',()=>vfs.initgroupfile(filename))!==0||vfs.gnumfiles[0]!==456)throw Error('Original archive initialization failed');
      if(typeof engine.engineInit!=='function')throw Error('Original engineInit is not linked');
      if(await enter('engineInit',()=>engine.engineInit())!==0)throw Error('Original engineInit failed');
      const palette=engine; // Original header storage belongs to engine.cpp.
      if((palette.paletteloaded&7)!==7||palette.numshades!==32)throw Error('Original palette did not load: '+JSON.stringify({flags:palette.paletteloaded,shades:palette.numshades}));
      const {sourceByteView,sourceSizedBytes}=await import('/runtime/source_bytes.mjs');
      const crc32=bytes=>{let c=-1;for(const b of bytes){c^=b;for(let bit=0;bit<8;bit++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (~c)>>>0;};
      const sine=sourceByteView(engine.sintable),angle=sourceByteView(engine.radarang);
      if(crc32(sine)!==0xee1e7aba||crc32(angle.subarray(0,1280))!==0xee893d92)throw Error('Original generated trig tables fail their source-native CRC constants');
      const directory=new DataView(archive.buffer),count=directory.getUint32(12,true);let offset=16+count*16,rawPalette=null;
      for(let i=0;i<count;i++){const name=new TextDecoder().decode(archive.subarray(16+i*16,28+i*16)).replace(/\0.*$/,'');const size=directory.getUint32(28+i*16,true);if(name.toUpperCase()==='PALETTE.DAT')rawPalette=archive.subarray(offset,offset+size);offset+=size;}
      if(!rawPalette)throw Error('Palette fixture missing');
      const originalPalette=sourceByteView(engine.palette),shadeBytes=palette.numshades*256;
      if(originalPalette.length!==768||originalPalette.some((b,i)=>b!==((rawPalette[i]<<2)&255)))throw Error('Original palette colors differ from the archive');
      const matches=(actual,expected)=>actual.length===expected.length&&actual.every((b,i)=>b===expected[i]);
      if(!matches(sourceSizedBytes(engine.palookup[0],shadeBytes,runtime.heap),rawPalette.subarray(770,770+shadeBytes)))throw Error('Original shade lookup differs from the archive');
      if(!matches(sourceSizedBytes(engine.blendtable[0],65536,runtime.heap),rawPalette.subarray(770+shadeBytes,770+shadeBytes+65536)))throw Error('Original translucency table differs from the archive');
      engineInitialization={original_engineInit_executed:true,original_native_trig_crc_constants_passed:true,palette_and_lookup_bytes_verified:768+shadeBytes+65536,original_palette_loaded:true,grp_entries:vfs.gnumfiles[0],palette_flags:palette.paletteloaded,palette_shades:palette.numshades,original_app_main_executed:false,original_CON_executed:false,original_world_rendered:false};
'''
video_mode_probe='--video-mode' in sys.argv
if video_mode_probe:
    sys.argv.remove('--video-mode')
    setup+=r'''
      const consoleModule=await import(base+'/source/build/src/osd.cpp.mjs');
      await enter('OSD_Init',()=>consoleModule.OSD_Init());
      if(await enter('enginePostInit',()=>engine.enginePostInit())!==0)throw Error('Original enginePostInit failed');
      const videoPlatform=await import(base+'/source/build/src/sdlayer.cpp.mjs');
      if(await enter('videoSetGameMode',()=>engine.videoSetGameMode(0,640,480,8,1))!==0)throw Error('Original videoSetGameMode failed: '+JSON.stringify({validmodecnt:engine.validmodecnt,novideo:videoPlatform.novideo,mode:videoPlatform.bpp,xres:videoPlatform.xres,yres:videoPlatform.yres,sdlError:(await import('/runtime/source_bytes.mjs')).sourceCString((await import(base+'/browser-abi/sdl_provider.mjs')).SDL_GetError(),runtime.heap)}));
      engineInitialization.original_enginePostInit_executed=true;
      engineInitialization.original_videoSetGameMode_executed=true;
      engineInitialization.video={width:engine.xdim,height:engine.ydim};
      if(engine.xdim!==640||engine.ydim!==480)throw Error('Original video dimensions differ');
'''
script=script.replace('const trace=[];let runtime=', 'const trace=[];let engineInitialization=null;let runtime=').replace('component_passed:false,trace,error:', 'component_passed:false,trace,engine_initialization:engineInitialization,error:')
draw_console='--draw-console' in sys.argv
if draw_console:
    sys.argv.remove('--draw-console')
    setup+=r'''
      const text=value=>Uint8Array.from([...new TextEncoder().encode(value),0]);
      await enter('OSD_Puts original console diagnostic',()=>consoleModule.OSD_Puts(text('Original Build engine - readable JavaScript startup\nGame menu and level are not linked yet.\n')));
      await enter('OSD_WritePendingLines',()=>consoleModule.OSD_WritePendingLines());
      await enter('OSD_HandleScanCode console toggle',()=>consoleModule.OSD_HandleScanCode(41,1));
      await enter('OSD_Draw',()=>consoleModule.OSD_Draw());
      await enter('videoShowFrame',()=>videoPlatform.videoShowFrame(0));
      const pixels=document.querySelector('canvas').getContext('2d').getImageData(0,0,640,480).data;
      let visible=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]||pixels[i+1]||pixels[i+2])visible++;
      if(visible<100)throw Error('Original console did not render visible pixels');
      engineInitialization.original_console_rendered=true;engineInitialization.console_visible_pixels=visible;
      globalThis.__sourceOriginalConsoleCapture=document.querySelector('canvas').toDataURL('image/png');
'''
screenshot=None
if '--screenshot' in sys.argv:
    index=sys.argv.index('--screenshot');screenshot=Path(sys.argv[index+1]).resolve();del sys.argv[index:index+2];screenshot.parent.mkdir(parents=True,exist_ok=True)
    class Capture(ast.NodeTransformer):
        def visit_Expr(self,node):
            if isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Attribute) and isinstance(node.value.func.value,ast.Name) and node.value.func.value.id=='browser' and node.value.func.attr=='close':
                capture=ast.parse("if result.get('engine_initialization',{}).get('original_console_rendered'):Path("+repr(str(screenshot))+").write_bytes(__import__('base64').b64decode(page.evaluate('globalThis.__sourceOriginalConsoleCapture').split(',',1)[1]))").body[0]
                return [capture,node]
            return self.generic_visit(node)
    tree=Capture().visit(tree)
scripts[0].value=script.replace(anchor,anchor+setup).replace('fresh_startup_without_precalled_helpers:true','fresh_startup_without_precalled_helpers:true,engine_initialization:engineInitialization')
if '--report' not in sys.argv:sys.argv+=['--report','reports/nov04-original-engine-init.json']
report=Path(sys.argv[sys.argv.index('--report')+1])
try:exec(compile(ast.fix_missing_locations(tree),str(path),'exec'),{'__file__':str(path),'__name__':'__main__'})
except SystemExit:
    if report.is_file():
        d=json.loads(report.read_text());d['original_engine_init_probe']={'script':Path(__file__).relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'manual_game_state_initialized':False,'original_app_main_executed':False,'gameplay_verified':False}
        report.write_bytes((json.dumps(d,indent=2)+'\n').encode())
        if video_mode_probe and not draw_console:
            profile=json.loads((ROOT/'tools/browser_classic_profile.json').read_text());target=ROOT/profile['engine_execution_report'];temporary=target.with_suffix('.tmp');temporary.write_bytes((json.dumps(d,indent=2)+'\n').encode());temporary.replace(target)
    raise
