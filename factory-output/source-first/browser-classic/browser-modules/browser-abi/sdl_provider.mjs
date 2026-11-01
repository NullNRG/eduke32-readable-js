// AUTO-GENERATED: executable browser SDL ABI functions, never no-op symbol stubs.
// Generated from runtime/sdl_browser.mjs by tools/browser_target_abi.py.
let active = null;
let heap = null;
const BORROWED_CSTRINGS = new Set(["SDL_GameControllerName", "SDL_GetAudioDeviceName", "SDL_GetAudioDriver", "SDL_GetCurrentAudioDriver", "SDL_GetCurrentVideoDriver", "SDL_GetDisplayName", "SDL_GetError", "SDL_GetHint", "SDL_GetKeyName"]);
const sourceReturn = (name,value) => {
  if (!BORROWED_CSTRINGS.has(name) || !value) return value;
  if (!heap || !Number.isSafeInteger(value)) throw new TypeError('Borrowed SDL string needs ABI pointer');
  return new TextEncoder().encode(heap.readCString(value) + '\0');
};
export function bindBrowserSDL(runtime) {
  if (active !== null) throw new Error('Browser SDL ABI is already bound');
  const provided = runtime?.sdl?.symbols;
  if (!provided || typeof provided !== 'object') throw new TypeError('NativeRuntime SDL services are required');
  for (const name of BROWSER_SDL_SYMBOLS)
    if (typeof provided[name] !== 'function') throw new Error('Missing real browser SDL service: ' + name);
  active = provided; heap = runtime.heap;
  let detached = false;
  return () => { if (detached) return; detached = true; if (active === provided) { active = null; heap = null; } };
}
export const BROWSER_SDL_SYMBOLS = Object.freeze(["SDL_AtomicLock", "SDL_AtomicTryLock", "SDL_AtomicUnlock", "SDL_CaptureMouse", "SDL_CloseAudio", "SDL_CreateRGBSurfaceFrom", "SDL_CreateSystemCursor", "SDL_CreateWindow", "SDL_DestroyWindow", "SDL_FlushEvent", "SDL_FreeCursor", "SDL_FreeSurface", "SDL_GL_GetDrawableSize", "SDL_GameControllerClose", "SDL_GameControllerGetAxis", "SDL_GameControllerGetButton", "SDL_GameControllerGetSerial", "SDL_GameControllerGetStringForAxis", "SDL_GameControllerGetStringForButton", "SDL_GameControllerHasAxis", "SDL_GameControllerHasButton", "SDL_GameControllerHasRumble", "SDL_GameControllerName", "SDL_GameControllerNameForIndex", "SDL_GameControllerOpen", "SDL_GameControllerRumble", "SDL_GetAudioDeviceName", "SDL_GetAudioDriver", "SDL_GetClipboardText", "SDL_GetClosestDisplayMode", "SDL_GetCurrentAudioDriver", "SDL_GetCurrentVideoDriver", "SDL_GetDesktopDisplayMode", "SDL_GetDisplayDPI", "SDL_GetDisplayMode", "SDL_GetDisplayName", "SDL_GetError", "SDL_GetGlobalMouseState", "SDL_GetHint", "SDL_GetKeyName", "SDL_GetKeyboardFocus", "SDL_GetKeyboardState", "SDL_GetModState", "SDL_GetMouseFocus", "SDL_GetMouseState", "SDL_GetNumAudioDrivers", "SDL_GetNumDisplayModes", "SDL_GetNumVideoDisplays", "SDL_GetPerformanceCounter", "SDL_GetPerformanceFrequency", "SDL_GetRelativeMouseMode", "SDL_GetRevision", "SDL_GetVersion", "SDL_GetWindowDisplayIndex", "SDL_GetWindowFlags", "SDL_GetWindowGammaRamp", "SDL_GetWindowID", "SDL_GetWindowPosition", "SDL_GetWindowSize", "SDL_GetWindowSurface", "SDL_HasClipboardText", "SDL_Init", "SDL_InitSubSystem", "SDL_IsGameController", "SDL_IsTextInputActive", "SDL_JoystickClose", "SDL_JoystickEventState", "SDL_JoystickHasRumble", "SDL_JoystickNameForIndex", "SDL_JoystickNumAxes", "SDL_JoystickNumBalls", "SDL_JoystickNumButtons", "SDL_JoystickNumHats", "SDL_JoystickOpen", "SDL_JoystickRumble", "SDL_LockAudioDevice", "SDL_LockSurface", "SDL_NumJoysticks", "SDL_OpenAudioDevice", "SDL_OpenURL", "SDL_PauseAudioDevice", "SDL_PeepEvents", "SDL_PollEvent", "SDL_PumpEvents", "SDL_Quit", "SDL_QuitSubSystem", "SDL_RWFromConstMem", "SDL_SetClipboardText", "SDL_SetCursor", "SDL_SetHint", "SDL_SetRelativeMouseMode", "SDL_SetTextInputRect", "SDL_SetThreadPriority", "SDL_SetWindowBordered", "SDL_SetWindowDisplayMode", "SDL_SetWindowFullscreen", "SDL_SetWindowGammaRamp", "SDL_SetWindowGrab", "SDL_SetWindowIcon", "SDL_SetWindowPosition", "SDL_SetWindowSize", "SDL_SetWindowTitle", "SDL_ShowCursor", "SDL_ShowMessageBox", "SDL_ShowSimpleMessageBox", "SDL_StartTextInput", "SDL_StopTextInput", "SDL_UnlockAudioDevice", "SDL_UnlockSurface", "SDL_UpdateWindowSurface", "SDL_WarpMouseInWindow", "SDL_WasInit", "SDL_free", "SDL_getenv", "SDL_setenv"]);
export function SDL_AtomicLock(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_AtomicLock");
  return sourceReturn("SDL_AtomicLock", active.SDL_AtomicLock(...args));
}
export function SDL_AtomicTryLock(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_AtomicTryLock");
  return sourceReturn("SDL_AtomicTryLock", active.SDL_AtomicTryLock(...args));
}
export function SDL_AtomicUnlock(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_AtomicUnlock");
  return sourceReturn("SDL_AtomicUnlock", active.SDL_AtomicUnlock(...args));
}
export function SDL_CaptureMouse(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_CaptureMouse");
  return sourceReturn("SDL_CaptureMouse", active.SDL_CaptureMouse(...args));
}
export function SDL_CloseAudio(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_CloseAudio");
  return sourceReturn("SDL_CloseAudio", active.SDL_CloseAudio(...args));
}
export function SDL_CreateRGBSurfaceFrom(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_CreateRGBSurfaceFrom");
  return sourceReturn("SDL_CreateRGBSurfaceFrom", active.SDL_CreateRGBSurfaceFrom(...args));
}
export function SDL_CreateSystemCursor(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_CreateSystemCursor");
  return sourceReturn("SDL_CreateSystemCursor", active.SDL_CreateSystemCursor(...args));
}
export function SDL_CreateWindow(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_CreateWindow");
  return sourceReturn("SDL_CreateWindow", active.SDL_CreateWindow(...args));
}
export function SDL_DestroyWindow(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_DestroyWindow");
  return sourceReturn("SDL_DestroyWindow", active.SDL_DestroyWindow(...args));
}
export function SDL_FlushEvent(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_FlushEvent");
  return sourceReturn("SDL_FlushEvent", active.SDL_FlushEvent(...args));
}
export function SDL_FreeCursor(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_FreeCursor");
  return sourceReturn("SDL_FreeCursor", active.SDL_FreeCursor(...args));
}
export function SDL_FreeSurface(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_FreeSurface");
  return sourceReturn("SDL_FreeSurface", active.SDL_FreeSurface(...args));
}
export function SDL_GL_GetDrawableSize(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GL_GetDrawableSize");
  return sourceReturn("SDL_GL_GetDrawableSize", active.SDL_GL_GetDrawableSize(...args));
}
export function SDL_GameControllerClose(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerClose");
  return sourceReturn("SDL_GameControllerClose", active.SDL_GameControllerClose(...args));
}
export function SDL_GameControllerGetAxis(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerGetAxis");
  return sourceReturn("SDL_GameControllerGetAxis", active.SDL_GameControllerGetAxis(...args));
}
export function SDL_GameControllerGetButton(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerGetButton");
  return sourceReturn("SDL_GameControllerGetButton", active.SDL_GameControllerGetButton(...args));
}
export function SDL_GameControllerGetSerial(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerGetSerial");
  return sourceReturn("SDL_GameControllerGetSerial", active.SDL_GameControllerGetSerial(...args));
}
export function SDL_GameControllerGetStringForAxis(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerGetStringForAxis");
  return sourceReturn("SDL_GameControllerGetStringForAxis", active.SDL_GameControllerGetStringForAxis(...args));
}
export function SDL_GameControllerGetStringForButton(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerGetStringForButton");
  return sourceReturn("SDL_GameControllerGetStringForButton", active.SDL_GameControllerGetStringForButton(...args));
}
export function SDL_GameControllerHasAxis(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerHasAxis");
  return sourceReturn("SDL_GameControllerHasAxis", active.SDL_GameControllerHasAxis(...args));
}
export function SDL_GameControllerHasButton(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerHasButton");
  return sourceReturn("SDL_GameControllerHasButton", active.SDL_GameControllerHasButton(...args));
}
export function SDL_GameControllerHasRumble(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerHasRumble");
  return sourceReturn("SDL_GameControllerHasRumble", active.SDL_GameControllerHasRumble(...args));
}
export function SDL_GameControllerName(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerName");
  return sourceReturn("SDL_GameControllerName", active.SDL_GameControllerName(...args));
}
export function SDL_GameControllerNameForIndex(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerNameForIndex");
  return sourceReturn("SDL_GameControllerNameForIndex", active.SDL_GameControllerNameForIndex(...args));
}
export function SDL_GameControllerOpen(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerOpen");
  return sourceReturn("SDL_GameControllerOpen", active.SDL_GameControllerOpen(...args));
}
export function SDL_GameControllerRumble(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GameControllerRumble");
  return sourceReturn("SDL_GameControllerRumble", active.SDL_GameControllerRumble(...args));
}
export function SDL_GetAudioDeviceName(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetAudioDeviceName");
  return sourceReturn("SDL_GetAudioDeviceName", active.SDL_GetAudioDeviceName(...args));
}
export function SDL_GetAudioDriver(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetAudioDriver");
  return sourceReturn("SDL_GetAudioDriver", active.SDL_GetAudioDriver(...args));
}
export function SDL_GetClipboardText(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetClipboardText");
  return sourceReturn("SDL_GetClipboardText", active.SDL_GetClipboardText(...args));
}
export function SDL_GetClosestDisplayMode(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetClosestDisplayMode");
  return sourceReturn("SDL_GetClosestDisplayMode", active.SDL_GetClosestDisplayMode(...args));
}
export function SDL_GetCurrentAudioDriver(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetCurrentAudioDriver");
  return sourceReturn("SDL_GetCurrentAudioDriver", active.SDL_GetCurrentAudioDriver(...args));
}
export function SDL_GetCurrentVideoDriver(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetCurrentVideoDriver");
  return sourceReturn("SDL_GetCurrentVideoDriver", active.SDL_GetCurrentVideoDriver(...args));
}
export function SDL_GetDesktopDisplayMode(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetDesktopDisplayMode");
  return sourceReturn("SDL_GetDesktopDisplayMode", active.SDL_GetDesktopDisplayMode(...args));
}
export function SDL_GetDisplayDPI(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetDisplayDPI");
  return sourceReturn("SDL_GetDisplayDPI", active.SDL_GetDisplayDPI(...args));
}
export function SDL_GetDisplayMode(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetDisplayMode");
  return sourceReturn("SDL_GetDisplayMode", active.SDL_GetDisplayMode(...args));
}
export function SDL_GetDisplayName(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetDisplayName");
  return sourceReturn("SDL_GetDisplayName", active.SDL_GetDisplayName(...args));
}
export function SDL_GetError(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetError");
  return sourceReturn("SDL_GetError", active.SDL_GetError(...args));
}
export function SDL_GetGlobalMouseState(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetGlobalMouseState");
  return sourceReturn("SDL_GetGlobalMouseState", active.SDL_GetGlobalMouseState(...args));
}
export function SDL_GetHint(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetHint");
  return sourceReturn("SDL_GetHint", active.SDL_GetHint(...args));
}
export function SDL_GetKeyName(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetKeyName");
  return sourceReturn("SDL_GetKeyName", active.SDL_GetKeyName(...args));
}
export function SDL_GetKeyboardFocus(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetKeyboardFocus");
  return sourceReturn("SDL_GetKeyboardFocus", active.SDL_GetKeyboardFocus(...args));
}
export function SDL_GetKeyboardState(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetKeyboardState");
  return sourceReturn("SDL_GetKeyboardState", active.SDL_GetKeyboardState(...args));
}
export function SDL_GetModState(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetModState");
  return sourceReturn("SDL_GetModState", active.SDL_GetModState(...args));
}
export function SDL_GetMouseFocus(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetMouseFocus");
  return sourceReturn("SDL_GetMouseFocus", active.SDL_GetMouseFocus(...args));
}
export function SDL_GetMouseState(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetMouseState");
  return sourceReturn("SDL_GetMouseState", active.SDL_GetMouseState(...args));
}
export function SDL_GetNumAudioDrivers(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetNumAudioDrivers");
  return sourceReturn("SDL_GetNumAudioDrivers", active.SDL_GetNumAudioDrivers(...args));
}
export function SDL_GetNumDisplayModes(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetNumDisplayModes");
  return sourceReturn("SDL_GetNumDisplayModes", active.SDL_GetNumDisplayModes(...args));
}
export function SDL_GetNumVideoDisplays(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetNumVideoDisplays");
  return sourceReturn("SDL_GetNumVideoDisplays", active.SDL_GetNumVideoDisplays(...args));
}
export function SDL_GetPerformanceCounter(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetPerformanceCounter");
  return sourceReturn("SDL_GetPerformanceCounter", active.SDL_GetPerformanceCounter(...args));
}
export function SDL_GetPerformanceFrequency(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetPerformanceFrequency");
  return sourceReturn("SDL_GetPerformanceFrequency", active.SDL_GetPerformanceFrequency(...args));
}
export function SDL_GetRelativeMouseMode(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetRelativeMouseMode");
  return sourceReturn("SDL_GetRelativeMouseMode", active.SDL_GetRelativeMouseMode(...args));
}
export function SDL_GetRevision(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetRevision");
  return sourceReturn("SDL_GetRevision", active.SDL_GetRevision(...args));
}
export function SDL_GetVersion(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetVersion");
  return sourceReturn("SDL_GetVersion", active.SDL_GetVersion(...args));
}
export function SDL_GetWindowDisplayIndex(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetWindowDisplayIndex");
  return sourceReturn("SDL_GetWindowDisplayIndex", active.SDL_GetWindowDisplayIndex(...args));
}
export function SDL_GetWindowFlags(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetWindowFlags");
  return sourceReturn("SDL_GetWindowFlags", active.SDL_GetWindowFlags(...args));
}
export function SDL_GetWindowGammaRamp(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetWindowGammaRamp");
  return sourceReturn("SDL_GetWindowGammaRamp", active.SDL_GetWindowGammaRamp(...args));
}
export function SDL_GetWindowID(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetWindowID");
  return sourceReturn("SDL_GetWindowID", active.SDL_GetWindowID(...args));
}
export function SDL_GetWindowPosition(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetWindowPosition");
  return sourceReturn("SDL_GetWindowPosition", active.SDL_GetWindowPosition(...args));
}
export function SDL_GetWindowSize(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetWindowSize");
  return sourceReturn("SDL_GetWindowSize", active.SDL_GetWindowSize(...args));
}
export function SDL_GetWindowSurface(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_GetWindowSurface");
  return sourceReturn("SDL_GetWindowSurface", active.SDL_GetWindowSurface(...args));
}
export function SDL_HasClipboardText(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_HasClipboardText");
  return sourceReturn("SDL_HasClipboardText", active.SDL_HasClipboardText(...args));
}
export function SDL_Init(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_Init");
  return sourceReturn("SDL_Init", active.SDL_Init(...args));
}
export function SDL_InitSubSystem(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_InitSubSystem");
  return sourceReturn("SDL_InitSubSystem", active.SDL_InitSubSystem(...args));
}
export function SDL_IsGameController(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_IsGameController");
  return sourceReturn("SDL_IsGameController", active.SDL_IsGameController(...args));
}
export function SDL_IsTextInputActive(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_IsTextInputActive");
  return sourceReturn("SDL_IsTextInputActive", active.SDL_IsTextInputActive(...args));
}
export function SDL_JoystickClose(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickClose");
  return sourceReturn("SDL_JoystickClose", active.SDL_JoystickClose(...args));
}
export function SDL_JoystickEventState(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickEventState");
  return sourceReturn("SDL_JoystickEventState", active.SDL_JoystickEventState(...args));
}
export function SDL_JoystickHasRumble(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickHasRumble");
  return sourceReturn("SDL_JoystickHasRumble", active.SDL_JoystickHasRumble(...args));
}
export function SDL_JoystickNameForIndex(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickNameForIndex");
  return sourceReturn("SDL_JoystickNameForIndex", active.SDL_JoystickNameForIndex(...args));
}
export function SDL_JoystickNumAxes(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickNumAxes");
  return sourceReturn("SDL_JoystickNumAxes", active.SDL_JoystickNumAxes(...args));
}
export function SDL_JoystickNumBalls(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickNumBalls");
  return sourceReturn("SDL_JoystickNumBalls", active.SDL_JoystickNumBalls(...args));
}
export function SDL_JoystickNumButtons(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickNumButtons");
  return sourceReturn("SDL_JoystickNumButtons", active.SDL_JoystickNumButtons(...args));
}
export function SDL_JoystickNumHats(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickNumHats");
  return sourceReturn("SDL_JoystickNumHats", active.SDL_JoystickNumHats(...args));
}
export function SDL_JoystickOpen(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickOpen");
  return sourceReturn("SDL_JoystickOpen", active.SDL_JoystickOpen(...args));
}
export function SDL_JoystickRumble(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_JoystickRumble");
  return sourceReturn("SDL_JoystickRumble", active.SDL_JoystickRumble(...args));
}
export function SDL_LockAudioDevice(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_LockAudioDevice");
  return sourceReturn("SDL_LockAudioDevice", active.SDL_LockAudioDevice(...args));
}
export function SDL_LockSurface(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_LockSurface");
  return sourceReturn("SDL_LockSurface", active.SDL_LockSurface(...args));
}
export function SDL_NumJoysticks(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_NumJoysticks");
  return sourceReturn("SDL_NumJoysticks", active.SDL_NumJoysticks(...args));
}
export function SDL_OpenAudioDevice(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_OpenAudioDevice");
  return sourceReturn("SDL_OpenAudioDevice", active.SDL_OpenAudioDevice(...args));
}
export function SDL_OpenURL(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_OpenURL");
  return sourceReturn("SDL_OpenURL", active.SDL_OpenURL(...args));
}
export function SDL_PauseAudioDevice(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_PauseAudioDevice");
  return sourceReturn("SDL_PauseAudioDevice", active.SDL_PauseAudioDevice(...args));
}
export function SDL_PeepEvents(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_PeepEvents");
  return sourceReturn("SDL_PeepEvents", active.SDL_PeepEvents(...args));
}
export function SDL_PollEvent(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_PollEvent");
  return sourceReturn("SDL_PollEvent", active.SDL_PollEvent(...args));
}
export function SDL_PumpEvents(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_PumpEvents");
  return sourceReturn("SDL_PumpEvents", active.SDL_PumpEvents(...args));
}
export function SDL_Quit(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_Quit");
  return sourceReturn("SDL_Quit", active.SDL_Quit(...args));
}
export function SDL_QuitSubSystem(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_QuitSubSystem");
  return sourceReturn("SDL_QuitSubSystem", active.SDL_QuitSubSystem(...args));
}
export function SDL_RWFromConstMem(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_RWFromConstMem");
  return sourceReturn("SDL_RWFromConstMem", active.SDL_RWFromConstMem(...args));
}
export function SDL_SetClipboardText(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetClipboardText");
  return sourceReturn("SDL_SetClipboardText", active.SDL_SetClipboardText(...args));
}
export function SDL_SetCursor(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetCursor");
  return sourceReturn("SDL_SetCursor", active.SDL_SetCursor(...args));
}
export function SDL_SetHint(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetHint");
  return sourceReturn("SDL_SetHint", active.SDL_SetHint(...args));
}
export function SDL_SetRelativeMouseMode(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetRelativeMouseMode");
  return sourceReturn("SDL_SetRelativeMouseMode", active.SDL_SetRelativeMouseMode(...args));
}
export function SDL_SetTextInputRect(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetTextInputRect");
  return sourceReturn("SDL_SetTextInputRect", active.SDL_SetTextInputRect(...args));
}
export function SDL_SetThreadPriority(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetThreadPriority");
  return sourceReturn("SDL_SetThreadPriority", active.SDL_SetThreadPriority(...args));
}
export function SDL_SetWindowBordered(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowBordered");
  return sourceReturn("SDL_SetWindowBordered", active.SDL_SetWindowBordered(...args));
}
export function SDL_SetWindowDisplayMode(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowDisplayMode");
  return sourceReturn("SDL_SetWindowDisplayMode", active.SDL_SetWindowDisplayMode(...args));
}
export function SDL_SetWindowFullscreen(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowFullscreen");
  return sourceReturn("SDL_SetWindowFullscreen", active.SDL_SetWindowFullscreen(...args));
}
export function SDL_SetWindowGammaRamp(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowGammaRamp");
  return sourceReturn("SDL_SetWindowGammaRamp", active.SDL_SetWindowGammaRamp(...args));
}
export function SDL_SetWindowGrab(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowGrab");
  return sourceReturn("SDL_SetWindowGrab", active.SDL_SetWindowGrab(...args));
}
export function SDL_SetWindowIcon(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowIcon");
  return sourceReturn("SDL_SetWindowIcon", active.SDL_SetWindowIcon(...args));
}
export function SDL_SetWindowPosition(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowPosition");
  return sourceReturn("SDL_SetWindowPosition", active.SDL_SetWindowPosition(...args));
}
export function SDL_SetWindowSize(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowSize");
  return sourceReturn("SDL_SetWindowSize", active.SDL_SetWindowSize(...args));
}
export function SDL_SetWindowTitle(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_SetWindowTitle");
  return sourceReturn("SDL_SetWindowTitle", active.SDL_SetWindowTitle(...args));
}
export function SDL_ShowCursor(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_ShowCursor");
  return sourceReturn("SDL_ShowCursor", active.SDL_ShowCursor(...args));
}
export function SDL_ShowMessageBox(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_ShowMessageBox");
  return sourceReturn("SDL_ShowMessageBox", active.SDL_ShowMessageBox(...args));
}
export function SDL_ShowSimpleMessageBox(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_ShowSimpleMessageBox");
  return sourceReturn("SDL_ShowSimpleMessageBox", active.SDL_ShowSimpleMessageBox(...args));
}
export function SDL_StartTextInput(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_StartTextInput");
  return sourceReturn("SDL_StartTextInput", active.SDL_StartTextInput(...args));
}
export function SDL_StopTextInput(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_StopTextInput");
  return sourceReturn("SDL_StopTextInput", active.SDL_StopTextInput(...args));
}
export function SDL_UnlockAudioDevice(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_UnlockAudioDevice");
  return sourceReturn("SDL_UnlockAudioDevice", active.SDL_UnlockAudioDevice(...args));
}
export function SDL_UnlockSurface(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_UnlockSurface");
  return sourceReturn("SDL_UnlockSurface", active.SDL_UnlockSurface(...args));
}
export function SDL_UpdateWindowSurface(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_UpdateWindowSurface");
  return sourceReturn("SDL_UpdateWindowSurface", active.SDL_UpdateWindowSurface(...args));
}
export function SDL_WarpMouseInWindow(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_WarpMouseInWindow");
  return sourceReturn("SDL_WarpMouseInWindow", active.SDL_WarpMouseInWindow(...args));
}
export function SDL_WasInit(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_WasInit");
  return sourceReturn("SDL_WasInit", active.SDL_WasInit(...args));
}
export function SDL_free(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_free");
  return sourceReturn("SDL_free", active.SDL_free(...args));
}
export function SDL_getenv(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_getenv");
  return sourceReturn("SDL_getenv", active.SDL_getenv(...args));
}
export function SDL_setenv(...args) {
  if (!active) throw new Error("Browser SDL ABI is not bound: SDL_setenv");
  return sourceReturn("SDL_setenv", active.SDL_setenv(...args));
}
