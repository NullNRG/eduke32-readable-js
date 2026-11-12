"""Execute original ART/cache initialization; validate original archive dimensions."""
import ast,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];probe=ROOT/'work/verify_original_engine_init.py'
tree=ast.parse(probe.read_text())
blocks=[n for n in ast.walk(tree) if isinstance(n,ast.Constant) and isinstance(n.value,str) and 'engineInitialization.video={width:engine.xdim' in n.value]
assert len(blocks)==1
blocks[0].value+=r'''
      const tiles=await enter('import original ART',()=>import(base+'/source/build/src/tiles.cpp.mjs'));
      const artFilename=Uint8Array.from([...new TextEncoder().encode('tiles000.art'),0]);
      const artResult=await enter('artLoadFiles original tiles000.art',()=>tiles.artLoadFiles(artFilename,16<<20));
      if(artResult!==0)throw Error('Original artLoadFiles failed: '+artResult);
      let artOffset=16+count*16,artFiles=0,tileDimensions=0,nonemptyTiles=0;
      for(let index=0;index<count;index++) {
        const name=new TextDecoder().decode(archive.subarray(16+index*16,28+index*16)).replace(/\0.*$/,'');
        const size=directory.getUint32(28+index*16,true);
        if(/^TILES[0-9]{3}\.ART$/i.test(name)) {
          const art=new DataView(archive.buffer,archive.byteOffset+artOffset,size);
          if(art.getInt32(0,true)!==1)throw Error('Unsupported original ART header '+name);
          const first=art.getInt32(8,true),last=art.getInt32(12,true),entries=last-first+1;
          if(entries<=0||16+entries*8>size)throw Error('Invalid original ART extents '+name);
          for(let local=0;local<entries;local++) {
            const x=art.getInt16(16+local*2,true),y=art.getInt16(16+entries*2+local*2,true);
            const actual=engine.tilesiz[first+local];
            if(actual.x!==x||actual.y!==y)throw Error('Original ART dimension mismatch '+name+' tile '+(first+local)+': '+JSON.stringify([actual.x,actual.y,x,y]));
            tileDimensions+=2;if(x>0&&y>0)nonemptyTiles++;
          }
          artFiles++;
        }
        artOffset+=size;
      }
      if(!artFiles||!nonemptyTiles)throw Error('Original ART was not loaded');
      const cache=await enter('import original cache',()=>import(base+'/source/build/src/cache1d.cpp.mjs'));
      const blocks=cache.g_cache.numBlocks();
      if(blocks!==1)throw Error('Original cache did not initialize one free block: '+blocks);
      const indexBytes=sourceSizedBytes(cache.g_cache.getIndex(),24,runtime.heap);
      const cacheLength=new DataView(indexBytes.buffer,indexBytes.byteOffset,indexBytes.byteLength).getInt32(16,true);
      if(cacheLength!==tiles.g_vm_size||cacheLength!==(16<<20))throw Error('Original cache extent differs from original ART allocation: '+JSON.stringify({length:cacheLength,allocated:tiles.g_vm_size}));
      engineInitialization.original_artLoadFiles_executed=true;
      engineInitialization.original_cache_initBuffer_executed=true;
      engineInitialization.original_art_archive_files_verified=artFiles;
      engineInitialization.original_art_tile_dimensions_verified=tileDimensions;
      engineInitialization.original_art_nonempty_tiles=nonemptyTiles;
      engineInitialization.original_cache_initial_blocks=blocks;
      engineInitialization.original_cache_bytes=cacheLength;
      engineInitialization.art_oracle='original GRP ART headers and original cacheindex_t LP64 layout; no manually populated tile/cache state';
'''
if '--video-mode' not in sys.argv:sys.argv.append('--video-mode')
if '--report' not in sys.argv:sys.argv+=['--report','reports/nov11-original-art-load.json']
report=ROOT/sys.argv[sys.argv.index('--report')+1]
try:
    exec(compile(ast.fix_missing_locations(tree),str(probe),'exec'),{'__file__':str(probe),'__name__':'__main__'})
finally:
    if report.is_file():
        doc=json.loads(report.read_text());doc['art_component_scope']={'script':Path(__file__).relative_to(ROOT).as_posix(),'original_app_main_executed':False,'world_rendering_verified':False,'tile_pixel_loading_verified':False,'gameplay_verified':False};report.write_text(json.dumps(doc,indent=2)+'\n')
