"""Execute original rooms + mask drawing against raw E1L1 engine state.

This does not claim game/CON initialization, app_main or gameplay. The original
room probe performs all asset loading and initialization; no sprites are added.
"""
import ast,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'work/verify_original_rooms_frame.py'
tree=ast.parse(source.read_text())
matched=0
for node in ast.walk(tree):
 if not isinstance(node,ast.Constant) or not isinstance(node.value,str):continue
 if "await enter('original videoShowFrame rooms'" in node.value:
  marker="      const canvas=document.querySelector('canvas'),rgba="
  assert node.value.count(marker)==1
  node.value=node.value.replace(marker,r'''
      if(typeof engine.renderDrawMasks!=='function')throw Error('Original mask renderer is not linked');
      const maskCanvas=document.querySelector('canvas'),beforeMasks=maskCanvas.getContext('2d').getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
      const queuedSprites=Number(engine.spritesortcnt),queuedWalls=Number(engine.maskwallcnt);
      const surfaceOwner=await import(base+'/source/build/src/softsurface.cpp.mjs');
      const inspectIndexed=()=>{const bytes=sourceSizedBytes(surfaceOwner.softsurface_getBuffer(),engine.xdim*engine.ydim,runtime.heap);
        let nonzero=0;const colors=new Set();for(const value of bytes){if(value)nonzero++;colors.add(value);}return {nonzero,colors:colors.size,crc32:crc32(bytes)};};
      const indexedBeforeMasks=inspectIndexed();
      const inspectPresentation=()=>{
        const surface=sourceSizedBytes(videoPlatform.__cxx_private_cell_36c1ac07e31aed8d3265cb02().value,96,runtime.heap);
        const view=new DataView(surface.buffer,surface.byteOffset,surface.byteLength),pixels=Number(view.getBigUint64(32,true));
        const rgba=sourceSizedBytes(pixels,view.getInt32(24,true)*view.getInt32(20,true),runtime.heap);
        let visible=0;for(let p=0;p<rgba.length;p+=4)if(rgba[p]||rgba[p+1]||rgba[p+2])visible++;
        return {pixels,visible,crc32:crc32(rgba),heap_bytes:runtime.heap.u8.length,
          palette_crc32:crc32(sourceSizedBytes(surfaceOwner.__cxx_private_cell_a769d375d1a430bdc3b558b9().value,1024,runtime.heap))};
      };
      const presentationBefore=inspectPresentation();
      const presentationCalls=[];engineInitialization.original_canvas_presentation_calls=presentationCalls;
      const context=maskCanvas.getContext('2d'),originalPutImageData=context.putImageData;
      context.putImageData=function(image,...arguments_){
        let visible=0,zeroAlpha=0;for(let p=0;p<image.data.length;p+=4){if(image.data[p]||image.data[p+1]||image.data[p+2])visible++;if(image.data[p+3]===0)zeroAlpha++;}
        const result=originalPutImageData.call(this,image,...arguments_);
        const actual=this.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;let displayed=0;
        for(let p=0;p<actual.length;p+=4)if(actual[p]||actual[p+1]||actual[p+2])displayed++;
        presentationCalls.push({input_visible:visible,zero_alpha:zeroAlpha,displayed,crc32:crc32(image.data)});return result;
      };
      await enter('original videoShowFrame repeated presentation check',()=>videoPlatform.videoShowFrame(0));
      const repeated=maskCanvas.getContext('2d').getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
      let repeatChanges=0;for(let p=0;p<repeated.length;p+=4)if(repeated[p]!==beforeMasks[p]||repeated[p+1]!==beforeMasks[p+1]||repeated[p+2]!==beforeMasks[p+2])repeatChanges++;
      engineInitialization.original_repeat_presentation={changed_pixels:repeatChanges,indexed_before:indexedBeforeMasks,indexed_after:inspectIndexed(),
        destination_before:presentationBefore,destination_after:inspectPresentation()};
      await enter('original renderDrawMasks raw E1L1 engine state',()=>engine.renderDrawMasks());
      await enter('original videoShowFrame masks',()=>videoPlatform.videoShowFrame(0));
      const afterMasks=maskCanvas.getContext('2d').getImageData(0,0,maskCanvas.width,maskCanvas.height).data;
      let changedMaskPixels=0;
      for(let p=0;p<afterMasks.length;p+=4)if(afterMasks[p]!==beforeMasks[p]||afterMasks[p+1]!==beforeMasks[p+1]||afterMasks[p+2]!==beforeMasks[p+2])changedMaskPixels++;
      engineInitialization.original_mask_renderer={executed:true,queued_sprites:queuedSprites,queued_walls:queuedWalls,changed_pixels:changedMaskPixels,
        indexed_after:inspectIndexed(),destination_after:inspectPresentation(),original_game_sprite_animation_executed:false,original_gameplay_verified:false};
''' + marker)
  matched+=1
 elif node.value=='reports/nov12-original-rooms-frame.json':node.value='reports/nov12-original-masked-frame.json'
 elif node.value=='reports/evidence/nov12-original-js-rooms-only.png':node.value='reports/evidence/nov12-original-js-engine-masks.png'
 elif node.value.startswith('Original JavaScript Build room renderer at original MAP start;'):
  node.value='Original JavaScript Build rooms/masks at raw MAP start; game/CON sprite initialization, app_main and gameplay remain unverified'
assert matched==1
try:
 exec(compile(ast.fix_missing_locations(tree),str(source),'exec'),{'__file__':str(source),'__name__':'__main__'})
finally:
 report=ROOT/'reports/nov12-original-masked-frame.json'
 if report.is_file():
  doc=json.loads(report.read_text())
  doc['mask_component_scope']={'original_app_main_executed':False,'original_CON_executed':False,
     'original_game_sprite_animation_executed':False,'gameplay_verified':False}
  report.write_text(json.dumps(doc,indent=2)+'\n')
