/* Native SDL2 services only. No EDuke32/Build/Mapster source is linked here.
 * The exported flat ABI is wasm32; readable engine JS retains its LP64 ABI.
 */
#include <SDL.h>
#include <emscripten.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>
#define SF_EXPORT EMSCRIPTEN_KEEPALIVE
_Static_assert(sizeof(void*) == 4, "Service ABI requires wasm32");
_Static_assert(sizeof(SDL_Color) == 4, "Palette ABI requires RGBA bytes");
static SDL_AudioDeviceID audio_device;
static SDL_AudioSpec audio_spec;

SF_EXPORT uint32_t sf_service_version(void) { return 1; }
SF_EXPORT uint32_t sf_sdl_version(void) {
    SDL_version version; SDL_GetVersion(&version);
    return ((uint32_t)version.major << 16) | ((uint32_t)version.minor << 8) | version.patch;
}
SF_EXPORT uint32_t sf_alloc(uint32_t size) { return (uint32_t)(uintptr_t)malloc(size); }
SF_EXPORT void sf_free(uint32_t pointer) { free((void*)(uintptr_t)pointer); }
SF_EXPORT uint32_t sf_error(void) { return (uint32_t)(uintptr_t)SDL_GetError(); }
SF_EXPORT int32_t sf_init(uint32_t flags) { return SDL_InitSubSystem(flags); }
SF_EXPORT void sf_shutdown(void) { SDL_Quit(); audio_device=0; }
SF_EXPORT uint64_t sf_counter(void) { return SDL_GetPerformanceCounter(); }
SF_EXPORT uint64_t sf_frequency(void) { return SDL_GetPerformanceFrequency(); }
SF_EXPORT uint64_t sf_ticks(void) { return SDL_GetTicks64(); }
SF_EXPORT int32_t sf_add_controller_mappings(uint32_t bytes, uint32_t length) {
    if (length > INT_MAX) return SDL_SetError("Controller database exceeds SDL buffer size");
    SDL_RWops *input=SDL_RWFromConstMem((const void*)(uintptr_t)bytes,(int)length);
    if (!input) return -1;
    return SDL_GameControllerAddMappingsFromRW(input,1);
}
SF_EXPORT uint32_t sf_create_window(uint32_t title, int32_t width, int32_t height) {
    return (uint32_t)(uintptr_t)SDL_CreateWindow((const char*)(uintptr_t)title,
        SDL_WINDOWPOS_UNDEFINED,SDL_WINDOWPOS_UNDEFINED,width,height,SDL_WINDOW_SHOWN);
}
SF_EXPORT void sf_destroy_window(uint32_t window) { SDL_DestroyWindow((SDL_Window*)(uintptr_t)window); }
SF_EXPORT int32_t sf_present_rgba(uint32_t window, uint32_t pixels, int32_t width, int32_t height, int32_t pitch) {
    SDL_Surface *source=SDL_CreateRGBSurfaceFrom((void*)(uintptr_t)pixels,width,height,32,pitch,
        0x000000ffu,0x0000ff00u,0x00ff0000u,0xff000000u);
    if (!source) return -1;
    SDL_Surface *target=SDL_GetWindowSurface((SDL_Window*)(uintptr_t)window);
    int result=target ? SDL_BlitScaled(source,NULL,target,NULL) : -1;
    if (!result) result=SDL_UpdateWindowSurface((SDL_Window*)(uintptr_t)window);
    SDL_FreeSurface(source); return result;
}
SF_EXPORT int32_t sf_present_indexed(uint32_t window, uint32_t pixels, int32_t width, int32_t height, int32_t pitch, uint32_t palette) {
    SDL_Surface *source=SDL_CreateRGBSurfaceFrom((void*)(uintptr_t)pixels,width,height,8,pitch,0,0,0,0);
    if (!source) return -1;
    int result=SDL_SetPaletteColors(source->format->palette,(SDL_Color*)(uintptr_t)palette,0,256);
    SDL_Surface *target=result ? NULL : SDL_GetWindowSurface((SDL_Window*)(uintptr_t)window);
    if (target) result=SDL_BlitScaled(source,NULL,target,NULL); else result=-1;
    if (!result) result=SDL_UpdateWindowSurface((SDL_Window*)(uintptr_t)window);
    SDL_FreeSurface(source); return result;
}
/* Stable service event envelope, not an SDL_Event byte-layout alias. */
SF_EXPORT int32_t sf_poll_event(uint32_t output) {
    SDL_Event event; if (!SDL_PollEvent(&event)) return 0;
    int32_t *data=(int32_t*)(uintptr_t)output; memset(data,0,16*sizeof(int32_t));
    data[0]=(int32_t)event.type; data[1]=(int32_t)event.common.timestamp;
    switch (event.type) {
    case SDL_QUIT: break;
    case SDL_KEYDOWN: case SDL_KEYUP:
        data[2]=event.key.keysym.scancode; data[3]=event.key.keysym.sym;
        data[4]=event.key.keysym.mod; data[5]=event.key.state; data[6]=event.key.repeat; break;
    case SDL_MOUSEMOTION:
        data[2]=event.motion.x; data[3]=event.motion.y; data[4]=event.motion.xrel;
        data[5]=event.motion.yrel; data[6]=(int32_t)event.motion.state; break;
    case SDL_MOUSEBUTTONDOWN: case SDL_MOUSEBUTTONUP:
        data[2]=event.button.x; data[3]=event.button.y; data[4]=event.button.button;
        data[5]=event.button.state; data[6]=event.button.clicks; break;
    case SDL_MOUSEWHEEL:
        data[2]=event.wheel.x; data[3]=event.wheel.y; data[4]=(int32_t)event.wheel.direction; break;
    case SDL_WINDOWEVENT:
        data[2]=event.window.event; data[3]=event.window.data1; data[4]=event.window.data2; break;
    case SDL_CONTROLLERAXISMOTION:
        data[2]=event.caxis.which; data[3]=event.caxis.axis; data[4]=event.caxis.value; break;
    case SDL_CONTROLLERBUTTONDOWN: case SDL_CONTROLLERBUTTONUP:
        data[2]=event.cbutton.which; data[3]=event.cbutton.button; data[4]=event.cbutton.state; break;
    case SDL_DROPFILE: case SDL_DROPTEXT:
        /* Filename ownership cannot cross this numeric event envelope. */
        SDL_free(event.drop.file); data[15]=1; break;
    default: data[15]=1; break;
    }
    return 1;
}
SF_EXPORT uint32_t sf_audio_open(int32_t frequency, int32_t channels, int32_t samples) {
    if (audio_device) { SDL_SetError("Service has one PCM output device"); return 0; }
    SDL_AudioSpec wanted; SDL_zero(wanted);
    wanted.freq=frequency; wanted.channels=(Uint8)channels; wanted.samples=(Uint16)samples;
    wanted.format=AUDIO_S16SYS;
    audio_device=SDL_OpenAudioDevice(NULL,0,&wanted,&audio_spec,SDL_AUDIO_ALLOW_FREQUENCY_CHANGE);
    return audio_device;
}
SF_EXPORT int32_t sf_audio_frequency(void) { return audio_spec.freq; }
SF_EXPORT int32_t sf_audio_channels(void) { return audio_spec.channels; }
SF_EXPORT int32_t sf_audio_queue(uint32_t device, uint32_t samples, uint32_t bytes) {
    return SDL_QueueAudio(device,(const void*)(uintptr_t)samples,bytes);
}
SF_EXPORT uint32_t sf_audio_queued(uint32_t device) { return SDL_GetQueuedAudioSize(device); }
SF_EXPORT void sf_audio_pause(uint32_t device, int32_t pause) { SDL_PauseAudioDevice(device,pause); }
SF_EXPORT void sf_audio_close(uint32_t device) { SDL_CloseAudioDevice(device); if (audio_device==device) audio_device=0; }
