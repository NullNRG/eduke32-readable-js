"""Exercise EDuke32's original RTS startup and lump lookup in Chromium."""
import json

from verify_original_demo_snapshot_heap import ROOT, run_browser_probe


PROBE = r'''async base => {
  const {NativeRuntime} = await import('/runtime/index.mjs');
  const runtime = new NativeRuntime({renderer:'canvas2d', memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const release = (await import(base+'/browser-abi/libc_provider.mjs')).bindBrowserC(runtime);
  try {
    const layer = await import(base+'/source/build/src/baselayer.cpp.mjs');
    const rts = await import(base+'/source/duke3d/src/rts.cpp.mjs');
    layer.engineSetupAllocator();
    const encoder = new TextEncoder();
    const cstr = text => encoder.encode(text+'\0');
    rts.RTS_Init(cstr('missing.rts'));
    if (rts.RTS_IsInitialized()) throw Error('Missing RTS changed source archive state');

    const directory=22;
    const bytes=new Uint8Array(directory+32), view=new DataView(bytes.buffer);
    bytes.set(encoder.encode('IWAD'));
    view.setInt32(4,2,true);
    view.setInt32(8,directory,true);
    bytes.set([1,2,3,4,5,6,7,8,9,10],12);
    for (const [index,position,length,name] of [[0,12,3,'ROOT'],[1,15,7,'SOUND']]) {
      const entry=directory+16*index;
      view.setInt32(entry,position,true);
      view.setInt32(entry+4,length,true);
      bytes.set(encoder.encode(name),entry+8);
    }
    runtime.fs.mountBytes('startup.rts',bytes);
    rts.RTS_Init(cstr('startup.rts'));
    if (!rts.RTS_IsInitialized() || rts.RTS_SoundLength(0)!==7 || rts.RTS_SoundLength(1)!==0)
      throw Error('Original RTS loader did not read the mounted IWAD directory');
    return {original_RTS_Init_verified:true, missing_archive_is_optional:true,
            directory_entries:2, first_sound_bytes:7, out_of_range_returns_zero:true};
  } finally {
    release();
    runtime.close();
  }
}'''

if __name__ == '__main__':
    result = run_browser_probe(PROBE)
    (ROOT / 'reports/nov18-original-rts-archive.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PASS original RTS archive startup and lump lookup in Chromium')
