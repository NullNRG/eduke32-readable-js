"""Check original cache allocation and tileLoad pixels against supplied GRP bytes."""
import ast
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
probe = ROOT / 'work/verify_original_art_load.py'
tree = ast.parse(probe.read_text())
blocks = [n for n in ast.walk(tree) if isinstance(n, ast.Constant)
          and isinstance(n.value, str) and "engineInitialization.art_oracle=" in n.value]
assert len(blocks) == 1
blocks[0].value += r'''
      let pixelOffset=16+count*16,verifiedPixelBytes=0,verifiedPixelTiles=0;
      const pixelFiles=[];
      for(let index=0;index<count;index++) {
        const name=new TextDecoder().decode(archive.subarray(16+index*16,28+index*16)).replace(/\0.*$/,'');
        const size=directory.getUint32(28+index*16,true);
        if(/^TILES[0-9]{3}\.ART$/i.test(name)) {
          const art=new DataView(archive.buffer,archive.byteOffset+pixelOffset,size);
          const first=art.getInt32(8,true),last=art.getInt32(12,true),entries=last-first+1;
          let dataOffset=16+8*entries;
          const candidates=[];
          for(let local=0;local<entries;local++) {
            const x=art.getInt16(16+local*2,true),y=art.getInt16(16+entries*2+local*2,true);
            const length=x*y;
            if(x>0&&y>0)candidates.push({tile:first+local,offset:dataOffset,length});
            dataOffset+=length;
          }
          if(dataOffset>size)throw Error('Original ART pixels exceed archive entry '+name);
          const selected=[...new Map([candidates[0],candidates[Math.floor(candidates.length/2)],candidates.at(-1)]
            .filter(Boolean).map(item=>[item.tile,item])).values()];
          for(const sample of selected) {
            await enter('original tileLoad '+sample.tile,()=>tiles.tileLoad(sample.tile));
            const actual=sourceSizedBytes(engine.waloff[sample.tile],sample.length,runtime.heap);
            const expected=archive.subarray(pixelOffset+sample.offset,pixelOffset+sample.offset+sample.length);
            for(let byte=0;byte<sample.length;byte++)if(actual[byte]!==expected[byte])
              throw Error('Original tile pixels differ '+name+' tile '+sample.tile+' byte '+byte);
            verifiedPixelBytes+=sample.length;verifiedPixelTiles++;
          }
          if(selected.length)pixelFiles.push(name);
        }
        pixelOffset+=size;
      }
      if(!verifiedPixelTiles)throw Error('No original tile pixels tested');
      engineInitialization.original_tileLoad_executed=true;
      engineInitialization.original_tile_pixels_verified={tiles:verifiedPixelTiles,bytes:verifiedPixelBytes,files:pixelFiles};
      engineInitialization.original_cache_blocks_after_pixels=cache.g_cache.numBlocks();
'''
if '--report' not in sys.argv:
    sys.argv += ['--report', 'reports/nov11-original-tile-pixels.json']
report = ROOT / sys.argv[sys.argv.index('--report') + 1]
try:
    exec(compile(ast.fix_missing_locations(tree), str(probe), 'exec'),
         {'__file__': str(probe), '__name__': '__main__'})
finally:
    if report.is_file():
        doc = json.loads(report.read_text())
        verified = bool(doc.get('engine_initialization', {}).get('original_tileLoad_executed'))
        # Keep component evidence distinct from real app_main/gameplay acceptance.
        doc['tile_pixel_component_scope'] = {
            'script': Path(__file__).relative_to(ROOT).as_posix(),
            'original_app_main_executed': False,
            'world_rendering_verified': False,
            'gameplay_verified': False,
        }
        if verified and 'art_component_scope' in doc:
            doc['art_component_scope']['tile_pixel_loading_verified'] = True
        report.write_text(json.dumps(doc, indent=2) + '\n')
