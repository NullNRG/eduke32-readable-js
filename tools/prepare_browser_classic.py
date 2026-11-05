"""Prepare a byte-attested browser source overlay and original Make inventory.

The browser selects the original GenericAllocator, without the optional small
block pool/thread caches, and excludes Linux ALSA from the driver table.
Original game/mixer code and the archived source tree remain unchanged.
"""
import argparse,hashlib,json,os,re,shlex,shutil,subprocess,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
DRIVERS='source/audiolib/src/drivers.cpp'
COMPAT='source/build/include/compat.h'
COMPAT_SOURCE='source/build/src/compat.cpp'
SMALLOC='source/build/include/smmalloc.h'
POOL_UNITS={'source/build/src/smmalloc.cpp','source/build/src/smmalloc_tls.cpp'}
def digest(data):return hashlib.sha256(data).hexdigest()
def replace_once(data,before,after):
    if data.count(before)!=1:raise ValueError('Original browser adaptation anchor changed: '+repr(before[:90]))
    return data.replace(before,after,1)
def adapted_bytes(data,adapt):
    # Archive files use both LF and CRLF. Preserve each file's original format.
    newline=b'\r\n' if b'\r\n' in data else b'\n'
    normalized=data.replace(b'\r\n',b'\n')
    if b'\r' in normalized or (newline==b'\r\n' and normalized.count(b'\n')!=data.count(b'\r\n')):
        raise ValueError('Mixed original source newline convention')
    return adapt(normalized).replace(b'\n',newline)
def browser_drivers(data):
    guard=b'#ifdef __linux__'
    if data.count(guard)!=2:raise ValueError('Original ALSA platform guards changed')
    return data.replace(guard,b'#if defined(__linux__) && !defined(EDUKE32_BROWSER)')
def browser_allocator_compat(data):
    start=data.index(b'extern sm_allocator g_sm_heap;')
    end=data.index(b'\n#endif',data.index(b'static FORCE_INLINE void xaligned_free(',start))
    original=data[start:end]
    browser=replace_once(original,b'extern sm_allocator g_sm_heap;',
        b'extern sm::GenericAllocator::TInstance g_sm_heap;')
    browser=replace_once(browser,
        b'    // 8 buckets of 2MB each--we don\'t really need to burn a lot of memory here for this thing to do its job\n'
        b'    g_sm_heap = _sm_allocator_create(SMM_MAX_BUCKET_COUNT, 2097152);\n'
        b'    _sm_allocator_thread_cache_create(g_sm_heap, sm::CACHE_HOT, { 20480, 32768, 32768, 1536, 4096, 8192, 128, 4096 });',
        b'    // Browser profile: use the original generic allocator without native pool/TLS caches.\n'
        b'    g_sm_heap = sm::GenericAllocator::Create();')
    browser=replace_once(browser,
        b'    _sm_allocator_thread_cache_destroy(g_sm_heap);\n    _sm_allocator_destroy(g_sm_heap);',
        b'    sm::GenericAllocator::Destroy(g_sm_heap);')
    calls={b'_sm_malloc(':b'sm::GenericAllocator::Alloc(',b'_sm_realloc(':b'sm::GenericAllocator::Realloc(',
           b'_sm_free(':b'sm::GenericAllocator::Free('}
    for before,after in calls.items():
        if before not in browser:raise ValueError('Missing original allocator operation '+repr(before))
        browser=browser.replace(before,after)
    if re.search(rb'\b_sm_\w+\s*\(',browser):raise ValueError('Browser allocator still references the pool API')
    return data[:start]+b'#if defined(EDUKE32_BROWSER)\n'+browser+b'\n#else\n'+original+b'\n#endif\n'+data[end:]
def browser_allocator_storage(data):
    return replace_once(data,b'sm_allocator g_sm_heap;',
        b'#if defined(EDUKE32_BROWSER)\nsm::GenericAllocator::TInstance g_sm_heap;\n'
        b'#else\nsm_allocator g_sm_heap;\n#endif')
def browser_allocator_statistics(data):
    return replace_once(data,b'#define SMMALLOC_STATS_SUPPORT',
        b'#if !defined(EDUKE32_BROWSER)\n#define SMMALLOC_STATS_SUPPORT\n#endif')

def browser_display_controls(data):
    # A browser canvas has no desktop output-monitor selector. Exclude only
    # that console control; resolution changes and the original renderer stay.
    begin=data.index(b'static int osdcmd_displayindex(')
    end=data.index(b'static int osdcmd_cvar_set_baselayer(',begin)
    original=data[begin:end]
    data=data[:begin]+b'#if !defined(EDUKE32_BROWSER)\n'+original+b'#endif\n\n'+data[end:]
    registration=(b'    static osdcvardata_t displayindex = { "r_displayindex","index of output display",(void*)&r_displayindex, CVAR_INT | CVAR_FUNCPTR, 0, 8 };\n'
                  b'    OSD_RegisterCvar(&displayindex, osdcmd_displayindex);')
    return replace_once(data,registration,
        b'#if !defined(EDUKE32_BROWSER)\n'+registration+b'\n#endif')
def browser_classic_sdl(data):
    """Keep original software video/input; exclude editor GUI and native haptics."""
    def within(data,begin,end,change):
        if data.count(begin)!=1 or data.count(end)!=1:raise ValueError('Original SDL feature boundary changed')
        first=data.index(begin);last=data.index(end,first)
        return data[:first]+change(data[first:last])+data[last:]
    def mouse(block):
        if block.count(b'#if SDL_MAJOR_VERSION >= 2')!=2:raise ValueError('Original editor mouse guards changed')
        return block.replace(b'#if SDL_MAJOR_VERSION >= 2',b'#if SDL_MAJOR_VERSION >= 2 && !defined(EDUKE32_BROWSER)')
    data=within(data,b'void mouseLockToWindow(char a)',b'// All things Video',mouse)
    def destroy(block):
        first=block.index(b'    if (g_ImGui_IO)');last=block.index(b'    if (sdl_window)',first)
        return block[:first]+b'#if !defined(EDUKE32_BROWSER)\n'+block[first:last]+b'#endif\n'+block[last:]
    data=within(data,b'static void destroy_window_resources()',b'bool g_ImGuiFrameActive;',destroy)
    def events(block):
        first=block.index(b'    if (g_ImGui_IO)');last=block.index(b'    while (SDL_PollEvent(&ev))',first)
        block=block[:first]+b'#if !defined(EDUKE32_BROWSER)\n'+block[first:last]+b'#endif\n\n'+block[last:]
        first=block.index(b'        if (g_ImGui_IO)',last);last=block.index(b'        switch (ev.type)',first)
        return block[:first]+b'#if !defined(EDUKE32_BROWSER)\n'+block[first:last]+b'#endif\n\n'+block[last:]
    # Restrict this adaptation to the SDL2 implementation, not its prototype.
    data=within(data,b'int32_t handleevents_pollsdl(void)\n{',b'int32_t handleevents(void)',events)
    return replace_once(data,b'#if SDL_VERSION_ATLEAST(2, 0, 9)\n    if (g_ImGuiFrameActive)',
        b'#if SDL_VERSION_ATLEAST(2, 0, 9) && !defined(EDUKE32_BROWSER)\n    if (g_ImGuiFrameActive)')

def browser_make(data):
    return replace_once(data,b'engine_objs := \\\n',
        b'# Browser allocations use smmalloc_generic.cpp; pool/TLS optimizations are excluded.\n'
        b'ifeq ($(SUBPLATFORM),BROWSER)\n'
        b'    engine_excl += smmalloc.cpp smmalloc_tls.cpp\nendif\n\nengine_objs := \\\n')
ADAPTATIONS=(
    (DRIVERS,browser_drivers,'Exclude ALSA backend; retain original SDL, OPL and mixer behavior'),
    (COMPAT,browser_allocator_compat,'Select original GenericAllocator for browser allocation wrappers; preserve original error handling'),
    (COMPAT_SOURCE,browser_allocator_storage,'Declare the browser allocator instance with its actual original GenericAllocator type'),
    (SMALLOC,browser_allocator_statistics,'Exclude pool statistics when the browser profile does not use a pool'),
    ('source/build/src/baselayer.cpp',browser_display_controls,
     'Exclude desktop output-monitor selection from the browser console; retain original video mode and rendering paths'),
    ('source/build/src/sdlayer.cpp',browser_classic_sdl,
     'Exclude editor ImGui interception/cleanup and native controller haptics from the classic browser platform; preserve original software video, event translation and device input'),
    ('GNUmakefile',browser_make,'Exclude unused pool and thread-cache units from original Make browser selection'),
)
def restore_source_archive(archive,destination,expected_sha):
    if digest(archive.read_bytes())!=expected_sha:raise ValueError('Original source archive checksum mismatch')
    destination=destination.resolve()
    with zipfile.ZipFile(archive) as source:
        members=source.infolist()
        for member in members:
            name=PurePosixPath(member.filename)
            if (name.is_absolute() or not name.parts or name.parts[0]!='eduke32-master'
                    or '..' in name.parts or '\\' in member.filename or ':' in member.filename
                    or (member.external_attr>>16)&0o170000==0o120000):
                raise ValueError('Unsafe original source archive member')
        for member in members:
            target=(destination/member.filename).resolve()
            if not target.is_relative_to(destination):raise ValueError('Source extraction escapes destination')
            if member.is_dir():target.mkdir(parents=True,exist_ok=True);continue
            if target.exists():
                if target.read_bytes()!=source.read(member):raise ValueError('Existing source differs; refusing overwrite')
                continue
            target.parent.mkdir(parents=True,exist_ok=True)
            with source.open(member) as incoming,target.open('wb') as output:shutil.copyfileobj(incoming,output)
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--make');a=p.parse_args()
    original=ROOT/'factory-output/source-tree/eduke32-master'
    folder=ROOT/'factory-output/browser-classic';overlay=folder/'source-tree/eduke32-master'
    if not (original/'GNUmakefile').is_file():
        restore_source_archive(ROOT/'input-source/eduke32-master.zip',original.parent,
            '495b988eb88a5f95256e30fe26c91d4fcbed2def5dd60a391512f05bce9dd097')
    make=a.make or shutil.which('make') or shutil.which('mingw32-make')
    native=ROOT/'reports/native-engine-build.json'
    if not make and native.is_file():make=json.loads(native.read_text())['command']['executable']
    if not make or not Path(make).is_file():raise SystemExit('Provide GNU Make with --make')
    folder.mkdir(parents=True,exist_ok=True)
    # This is a generated source overlay, never a second project or a reset of
    # emitted code. Preserve the input tree and record every differing byte.
    shutil.copytree(original,overlay,dirs_exist_ok=True)
    adaptations=[]
    for relative,adapt,reason in ADAPTATIONS:
        before=(original/relative).read_bytes();after=adapted_bytes(before,adapt)
        (overlay/relative).write_bytes(after)
        adaptations.append({'file':relative,'original_sha256':digest(before),'browser_sha256':digest(after),'reason':reason})
    flags=['PLATFORM=LINUX','SUBPLATFORM=BROWSER','NOASM=1','USE_OPENGL=0','POLYMER=0',
           'STARTUP_WINDOW=0','HAVE_GTK2=0','NETCODE=0','USE_MIMALLOC=0','HAVE_VORBIS=0','HAVE_FLAC=0',
           'HAVE_XMP=0','USE_LIBVPX=0','LTO=0','PRETTY_OUTPUT=0']
    command=[make,'-n','-B','eduke32',*flags]
    env={**os.environ,'PATH':str(Path(make).parent)+os.pathsep+os.environ['PATH']}
    run=subprocess.run(command,cwd=overlay,env=env,text=True,capture_output=True,timeout=90)
    (folder/'make-dryrun.log').write_text(run.stdout+'\n'+run.stderr)
    if run.returncode:raise SystemExit('Original Make selection failed; see make-dryrun.log')
    rows={}
    for line in run.stdout.splitlines():
        if not re.match(r'^(?:g\+\+|gcc|clang\+\+|clang)\s',line):continue
        args=shlex.split(line)
        if '-c' not in args:continue
        names=[v for v in args if v.startswith(('source/','obj/')) and v.endswith(('.cpp','.c','.cc'))]
        if len(names)!=1 or names[0] in rows:raise ValueError('Ambiguous compile command')
        clean=[];skip=False
        for arg in args:
            if skip:skip=False;continue
            if arg=='-dumpdir':skip=True;continue
            if arg.startswith('-save-temps'):continue
            clean.append(arg)
        clean.append('-DEDUKE32_BROWSER=1')
        rows[names[0]]={'directory':str(overlay),'file':names[0],'arguments':clean}
    if not rows or any('/mimalloc/' in n or '/libxmp-lite/' in n or n.endswith('driver_alsa.cpp') for n in rows):
        raise ValueError('Desktop backend leaked into browser selection')
    if POOL_UNITS & rows.keys():raise ValueError('Unused pool allocator leaked into browser selection')
    if 'source/build/src/smmalloc_generic.cpp' not in rows:raise ValueError('Original generic allocator missing from browser selection')
    captured={r['file'] for r in json.loads((ROOT/'factory-output/compile_commands.json').read_text())}
    payload=(json.dumps(list(rows.values()),indent=2)+'\n').encode()
    (folder/'compile_commands.json').write_bytes(payload)
    report={'format':'browser-classic-source-preparation/1','source_root':str(overlay),
        'command_database':'factory-output/browser-classic/compile_commands.json',
        'make_command':command,'make_returncode':run.returncode,'selected_units':len(rows),
        'selected_files':sorted(rows),'excluded_captured_units':sorted(captured-rows.keys()),
        'commands_sha256':digest(payload),'source_adaptations':adaptations,
        'allocator_backend':'original-sm-GenericAllocator',
        'excluded_pool_units':sorted(POOL_UNITS),
        'source_compilation_verified':False,'gameplay_verified':False}
    (ROOT/'reports/browser-classic-preparation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('selected_files','excluded_captured_units','make_command')},indent=2))
if __name__=='__main__':main()
