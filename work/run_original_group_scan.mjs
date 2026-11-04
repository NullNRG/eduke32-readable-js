import {readFile} from 'node:fs/promises';
import {probeOriginalGroupScan} from './probe_original_group_scan.mjs';
const base=new URL('../',import.meta.url);
try{console.log('SOURCE_GROUP_SCAN_RESULT '+JSON.stringify(await probeOriginalGroupScan({base,bytes:new Uint8Array(await readFile(new URL('input-data/DUKE3D.GRP',base)))})));}
catch(error){console.error(error.stack);process.exitCode=1;}
