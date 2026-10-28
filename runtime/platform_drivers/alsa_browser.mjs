/** Source-matched ALSA MIDI platform fallback, isolated from universal compiler.
 * Browser JS has no Linux ALSA sequencer. A missing device is reported through
 * the ORIGINAL ALSAErr_SeqOpen branch (-1, error code 2), never false success.
 * This is an optional/unsupported MIDI backend, not audio synthesis.
 */
export function createALSABrowser({heap,callCompiled}={}){
 if(!heap)throw TypeError('ALSA platform adapter needs C ABI heap');
 let error=0,active=false;
 const strings=new Map();
 const descriptions={0:'ALSA ok.',1:'ALSA uninitialised.',2:'ALSA error: failed in snd_seq_open.\n',3:'ALSA error: failed in snd_seq_create_simple_port.\n',
  4:'ALSA error: failed in snd_seq_alloc_queue.\n',5:'ALSA error: failed in snd_seq_connect_to.\n',6:'ALSA error: device not found.\n'};
 const str=code=>{if(!strings.has(code))strings.set(code,heap.writeCString(descriptions[code]??'Unknown ALSA error.'));return strings.get(code);};
 const needActive=()=>{if(!active)throw Error('ALSA MIDI operation on uninitialised device');};
 return Object.freeze({
  '_Z16ALSADrv_GetErrorv':()=>error,
  '_Z19ALSADrv_ErrorStringi':code=>str(code===-1||code===-2?error:Number(code)),
  '_Z17ALSADrv_MIDI_InitP9midifuncs':ptr=>{
    if(!ptr)throw Error('ALSA MIDI_Init called with NULL midifuncs');
    heap.check(Number(ptr),56);heap.memset(Number(ptr),0,56);
    error=2;active=false;return -1; // snd_seq_open unavailable in browser
  },
  '_Z21ALSADrv_MIDI_Shutdownv':()=>{active=false;},
  '_Z26ALSADrv_MIDI_StartPlaybackv':()=>{if(!active){error=1;return -1;}throw Error('ALSA sequencer playback unsupported');},
  '_Z25ALSADrv_MIDI_HaltPlaybackv':()=>{active=false;},
  '_Z22ALSADrv_MIDI_ListPortsv':ptr=>{
    if(!ptr)throw Error('ALSA vector sret address missing');
    heap.check(Number(ptr),24);heap.memset(Number(ptr),0,24);
  },
  '_Z21ALSADrv_MIDI_SetTempoii':()=>{needActive();},
  '_Z17ALSADrv_MIDI_Lockv':()=>{}, // Exactly matches original driver_alsa.cpp empty function.
  '_Z19ALSADrv_MIDI_Unlockv':()=>{}, // Exactly matches original driver_alsa.cpp empty function.
  '_Z20ALSADrv_MIDI_Servicev':()=>{
    needActive();if(typeof callCompiled!=='function')throw Error('Original MIDI_ServiceRoutine unavailable');
    return callCompiled('MIDI_ServiceRoutine',[]);
  },
 });
}
