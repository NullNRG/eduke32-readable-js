"""Load E1L1 through original engineLoadBoard after real engine/video startup.

This is a map-loading component gate. It does not initialize game/CON state or
claim a rendered world, menu, app_main execution, or interactive gameplay.
"""
import ast
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
probe = ROOT / 'work/verify_original_engine_init.py'
tree = ast.parse(probe.read_text())
blocks = [node for node in ast.walk(tree) if isinstance(node, ast.Constant)
          and isinstance(node.value, str) and 'engineInitialization.video={width:engine.xdim' in node.value]
assert len(blocks) == 1
map_probe = r'''
      let originalMap=null,mapOffset=16+count*16;
      for(let i=0;i<count;i++) {
        const name=new TextDecoder().decode(archive.subarray(16+i*16,28+i*16)).replace(/\0.*$/,'');
        const size=directory.getUint32(28+i*16,true);
        if(name.toUpperCase()==='E1L1.MAP')originalMap=archive.subarray(mapOffset,mapOffset+size);
        mapOffset+=size;
      }
      if(!originalMap)throw Error('Supplied GRP contains no E1L1.MAP');
      const mapHeader=new DataView(originalMap.buffer,originalMap.byteOffset,originalMap.byteLength);
      if(mapHeader.getInt32(0,true)!==7)throw Error('This disk-format oracle covers original version-7 maps only');
      const expectedSectors=mapHeader.getInt16(20,true);
      const wallsOffset=22+expectedSectors*40,expectedWalls=mapHeader.getInt16(wallsOffset,true);
      const spritesOffset=wallsOffset+2+expectedWalls*32,expectedSprites=mapHeader.getInt16(spritesOffset,true);
      if(spritesOffset+2+expectedSprites*44!==originalMap.byteLength)throw Error('Original map size disagrees with its version-7 record counts');
      if(typeof engine.engineLoadBoard!=='function')throw Error('Original engineLoadBoard is not linked');
      const mapOutputPosition=new Uint8Array(12),mapOutputAngle=new Int16Array(1),mapOutputSector=new Int16Array(1);
      const mapName=Uint8Array.from([...new TextEncoder().encode('E1L1.MAP'),0]);
      const removed=await enter('engineLoadBoard E1L1.MAP',()=>engine.engineLoadBoard(mapName,0,mapOutputPosition,mapOutputAngle,mapOutputSector));
      if(removed!==0)throw Error('Original E1L1 loading failed or removed sprites: '+removed);
      const positionView=new DataView(mapOutputPosition.buffer);
      const mapOutputPoint=[0,4,8].map(offset=>positionView.getInt32(offset,true));
      const expectedPoint=[4,8,12].map(offset=>mapHeader.getInt32(offset,true));
      if(mapOutputPoint.some((value,index)=>value!==expectedPoint[index])||mapOutputAngle[0]!==mapHeader.getInt16(16,true)||mapOutputSector[0]!==mapHeader.getInt16(18,true))
        throw Error('Original map output position/angle/sector differs from the supplied archive');
      if(engine.numsectors!==expectedSectors||engine.numwalls!==expectedWalls||engine.Numsprites!==expectedSprites)
        throw Error('Original loaded map counts differ: '+JSON.stringify({sectors:engine.numsectors,walls:engine.numwalls,sprites:engine.Numsprites}));
      let geometryBytesVerified=0;
      for(const [storage,start,extent] of [[engine.sector,22,expectedSectors*40],[engine.wall,wallsOffset+2,expectedWalls*32]]) {
        const actual=sourceSizedBytes(storage,extent,runtime.heap),expected=originalMap.subarray(start,start+extent);
        if(actual.length!==extent||actual.some((value,index)=>value!==expected[index]))
          throw Error('Original loaded sector/wall storage differs from supplied MAP bytes');
        geometryBytesVerified+=extent;
      }
      const spriteBytes=sourceSizedBytes(engine.sprite,expectedSprites*44,runtime.heap);
      for(let index=0;index<expectedSprites;index++)for(let offset=0;offset<12;offset++) {
        if(spriteBytes[index*44+offset]!==originalMap[spritesOffset+2+index*44+offset])
          throw Error('Original sprite coordinates differ from supplied MAP record '+index);
        geometryBytesVerified++;
      }
      engineInitialization.original_map_geometry_bytes_verified=geometryBytesVerified;
      const mapStartInside=await enter('inside original map start',()=>engine.inside(mapOutputPoint[0],mapOutputPoint[1],mapOutputSector[0]));
      if(mapStartInside!==1)throw Error('Original geometry rejects the original map starting point');
      engineInitialization.original_E1L1_map_loaded=true;
      engineInitialization.original_map_counts={sectors:expectedSectors,walls:expectedWalls,sprites:expectedSprites};
      engineInitialization.original_map_start={position:mapOutputPoint,angle:mapOutputAngle[0],sector:mapOutputSector[0]};
      engineInitialization.original_geometry_start_inside=true;
      engineInitialization.map_oracle='supplied original version-7 MAP header, full sector/wall bytes, every sprite coordinate, extents and counts; no manual world-state initialization';
'''
all_maps='--all-grp-maps' in sys.argv
if all_maps:sys.argv.remove('--all-grp-maps')
map_name='E1L1.MAP'
if '--map-name' in sys.argv:
    index=sys.argv.index('--map-name');map_name=sys.argv[index+1]
    del sys.argv[index:index+2]
    if all_maps:raise ValueError('Choose one map or all GRP campaign maps')
    if not map_name.upper().endswith('.MAP'):raise ValueError('Expected an original MAP filename')
map_probe=map_probe.replace("name.toUpperCase()==='E1L1.MAP'", "name.toUpperCase()===mapToLoad.toUpperCase()")
map_probe=map_probe.replace("encode('E1L1.MAP')", "encode(mapToLoad)")
map_probe=map_probe.replace("enter('engineLoadBoard E1L1.MAP'", "enter('engineLoadBoard '+mapToLoad")
map_probe=map_probe.replace('engineInitialization.original_E1L1_map_loaded=true;', "if(mapToLoad==='E1L1.MAP')engineInitialization.original_E1L1_map_loaded=true;")
map_probe+="\n engineInitialization.original_maps_loaded.push({name:mapToLoad,counts:engineInitialization.original_map_counts,start:engineInitialization.original_map_start,geometry_bytes_verified:geometryBytesVerified});\n"
selection="const selectedMaps=[];for(let i=0;i<count;i++){const name=new TextDecoder().decode(archive.subarray(16+i*16,28+i*16)).replace(/\\0.*$/,'');if(/^E[1-9]L[0-9]+\\.MAP$/i.test(name))selectedMaps.push(name);}if(!selectedMaps.length)throw Error('No campaign MAP entries found');" if all_maps else 'const selectedMaps=['+json.dumps(map_name)+'];'
blocks[0].value+='\n'+selection+'\nengineInitialization.original_maps_loaded=[];for(const mapToLoad of selectedMaps){\n'+map_probe+'\n}\n'
if '--video-mode' not in sys.argv:
    sys.argv.append('--video-mode')
if '--report' not in sys.argv:
    sys.argv += ['--report', 'reports/nov10-original-e1l1-map-load.json']
report = ROOT / sys.argv[sys.argv.index('--report') + 1]
try:
    exec(compile(ast.fix_missing_locations(tree), str(probe), 'exec'),
         {'__file__': str(probe), '__name__': '__main__'})
finally:
    if report.is_file():
        document = json.loads(report.read_text())
        document['map_component_scope'] = {'script': Path(__file__).relative_to(ROOT).as_posix(),
                                           'selected_all_grp_campaign_maps': all_maps,
                                           'original_app_main_executed': False,
                                           'original_CON_executed': False,
                                           'world_rendering_verified': False,
                                           'gameplay_verified': False}
        report.write_text(json.dumps(document, indent=2) + '\n')
