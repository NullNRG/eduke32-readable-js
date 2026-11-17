"""Verify original VFS compression output and demo sync record bytes."""
import json

from verify_original_demo_snapshot_heap import ROOT, run_browser_probe


PROBE = r'''async base => {
  const {NativeRuntime} = await import('/runtime/index.mjs');
  const runtime = new NativeRuntime({renderer:'canvas2d', memoryBytes:16<<20});
  runtime.bindSourceMemory();
  const libc = await import(base+'/browser-abi/libc_provider.mjs');
  const release = libc.bindBrowserC(runtime);
  try {
    const layer = await import(base+'/source/build/src/baselayer.cpp.mjs');
    const vfs = await import(base+'/source/build/src/vfs.cpp.mjs');
    const lz4 = await import(base+'/source/build/src/lz4.c.mjs');
    layer.engineSetupAllocator();
    const str = (text) => new TextEncoder().encode(text+'\0');
    function write(name, writer) {
      const file = libc.fopen(str(name), str('wb'));
      if (!file) throw Error('Original file open failed for '+name);
      try { writer(file); }
      finally { libc.fclose(file); }
      return runtime.fs.readFile(name);
    }
    const written = [];
    const heapBefore = runtime.heap.allocations.size;
    for (const size of [4096, 140000]) {
      const source = Uint8Array.from({length:size}, (_,i) => (i*17 + (i>>5)) & 255);
      const bytes = write('check-'+size+'.edm', file => vfs.dfwrite_LZ4(source, 1, size, file));
      const length = new DataView(bytes.buffer,bytes.byteOffset).getInt32(0,true);
      if (length<1 || length+4!==bytes.length) throw Error('Original file length prefix differs');
      const decoded = new Uint8Array(size);
      if (lz4.LZ4_decompress_safe(bytes.subarray(4),decoded,length,size)!==size ||
          !decoded.every((value,index) => source[index]===value)) {
        throw Error('Original compressed file did not round trip at '+size);
      }
      written.push({input_bytes:size, compressed_bytes:length});
    }
    if (runtime.heap.allocations.size!==heapBefore) throw Error('Original LZ4 writer leaked scratch storage');
    const demo = await import(base+'/source/duke3d/src/demo.cpp.mjs');
    const {ud,recsync,apStrings} = await import(base+'/source/duke3d/src/global.cpp.mjs');
    const count=3, inputBytes=20;
    const expectedInput = new Uint8Array(count*inputBytes);
    const expectedView = new DataView(expectedInput.buffer);
    for (let row=0;row<count;row++) {
      recsync[row].fvel=-300+row*17;
      expectedView.setInt16(row*inputBytes+4,recsync[row].fvel,true);
    }
    ud.reccnt=count;
    const cell=demo.__cxx_global_cell_b8b854e6be4b2dfee7e6f10c();
    const sync = write('sync.edm', file => {
      cell.value=file;
      try { demo.Demo_WriteSync(); }
      finally { cell.value=null; }
    });
    const syncView=new DataView(sync.buffer,sync.byteOffset);
    if (ud.reccnt!==0 || new TextDecoder().decode(sync.subarray(0,4))!=='sYnC' ||
        syncView.getInt16(4,true)!==count || sync.subarray(6,6+count).some(Boolean)) {
      throw Error('Original demo sync header or record count differs');
    }
    const prefix=6+count;
    const length=syncView.getInt32(prefix,true);
    const decoded = new Uint8Array(expectedInput.length);
    if (sync.length!==prefix+4+length ||
        lz4.LZ4_decompress_safe(sync.subarray(prefix+4),decoded,length,decoded.length)!==decoded.length ||
        !decoded.every((value,index)=>value===expectedInput[index])) {
      throw Error('Original demo sync payload differs');
    }
    const file=libc.fopen(str('close.edm'),str('wb'));
    if (!file) throw Error('Original demo close fixture could not open its file');
    const header=new Uint8Array(64).fill(0xa7);
    if (Number(libc.fwrite(header,1n,64n,file))!==64) throw Error('Failed to stage demo header');
    const quote = new Uint8Array(64);
    apStrings[122]=quote;
    demo.__cxx_global_cell_e17a5783e4d4a0690d42cb8d().value=90;
    ud.fta_on=0;
    ud.recstat=ud.m_recstat=1;
    cell.value=file;
    demo.G_CloseDemoWrite();
    demo.G_CloseDemoWrite();
    const finalized=runtime.fs.readFile('close.edm');
    const finalizedView=new DataView(finalized.buffer,finalized.byteOffset);
    const decoder=new TextDecoder();
    if (cell.value!==null || ud.recstat!==0 || ud.m_recstat!==0 || finalized.length!==68 ||
        finalizedView.getInt32(28,true)!==90 || decoder.decode(finalized.subarray(64))!=='EnD!' ||
        decoder.decode(quote.subarray(0,quote.indexOf(0)))!=='DEMO RECORDING STOPPED') {
      throw Error('Original demo finalization did not patch the header, close, and publish its quote');
    }
    return {original_lz4_vfs_write_verified:true, records:written, scratch_storage_released:true,
            original_demo_sync_executed:true, demo_sync_records:count, demo_sync_bytes:sync.length,
            original_demo_close_executed:true, finalized_header_count:90, finalized_file_bytes:finalized.length};
  } finally {
    release();
    runtime.close();
  }
}'''


if __name__ == '__main__':
    result = run_browser_probe(PROBE)
    (ROOT / 'reports/nov18-original-demo-codec-write.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PASS original LZ4 compressed file writes in Chromium')
