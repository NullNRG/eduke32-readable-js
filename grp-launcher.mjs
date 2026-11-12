/** Read only the archive directory for selection; original engine loads assets. */
export function inspectGRP(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<16)throw Error('GRP header is missing');
 const bytes=new Uint8Array(buffer),view=new DataView(buffer),text=new TextDecoder('ascii');
 if(text.decode(bytes.subarray(0,12))!=='KenSilverman')throw Error('Expected a Duke/Build GRP archive');
 const count=view.getUint32(12,true),directoryEnd=16+count*16;
 if(!count||count>65536||directoryEnd>bytes.length)throw Error('GRP directory exceeds the file');
 let offset=directoryEnd;const files=[],maps=[];
 for(let i=0;i<count;i++){
  const name=text.decode(bytes.subarray(16+i*16,28+i*16)).replace(/\0.*$/,'').toUpperCase();
  const size=view.getUint32(28+i*16,true);
  if(!name||size>bytes.length-offset)throw Error('Invalid GRP entry '+(name||i));
  files.push(name);if(name.endsWith('.MAP'))maps.push(name);offset+=size;
 }
 if(offset!==bytes.length)throw Error('GRP extents do not match its file size');
 for(const required of ['PALETTE.DAT','TABLES.DAT','TILES000.ART'])if(!files.includes(required))throw Error('This preview needs a base Duke GRP containing '+required);
 if(!maps.length)throw Error('This GRP contains no MAP files');
 if(new Set(maps).size!==maps.length)throw Error('Duplicate MAP names are ambiguous');
 return {count,maps};
}
