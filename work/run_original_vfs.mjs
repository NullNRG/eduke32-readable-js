import {readFile} from 'node:fs/promises';
import {probeOriginalVFS} from './probe_original_vfs.mjs';
const base=new URL('../',import.meta.url);
try{console.log(JSON.stringify(await probeOriginalVFS({base,bytes:new Uint8Array(await readFile(new URL('input-data/DUKE3D.GRP',base)))}),null,2));}
catch(error){console.error(error.stack);process.exitCode=1;}
