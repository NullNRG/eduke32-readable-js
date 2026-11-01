// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/mutex.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { SDL_AtomicLock } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_AtomicUnlock } from "../../../browser-abi/sdl_provider.mjs";
import { pthread_mutex_destroy } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_init } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_lock } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_unlock } from "../../../browser-abi/libc_provider.mjs";

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu\c++\12/bits/gthr-default.h:730
export function __gthread_mutex_init_function(__mutex) {
  if (Boolean(__gthread_active_p())) {
    pthread_mutex_init(__mutex, null);
  }
}

// C/C++ source: source/build/src/mutex.cpp:4
export function mutex_init(mutex) {
  ((mutex).value = i32(0));
  return i32(0);
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu\c++\12/bits/gthr-default.h:746
export function __gthread_mutex_lock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_lock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu\c++\12/bits/gthr-default.h:809
export function __gthread_recursive_mutex_lock(__mutex) {
  return i32(__gthread_mutex_lock(__mutex));
}

// C/C++ source: source/build/include/mutex.h:29
export function mutex_lock(mutex) {
  SDL_AtomicLock(mutex);
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu\c++\12/bits/gthr-default.h:776
export function __gthread_mutex_unlock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_unlock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu\c++\12/bits/gthr-default.h:830
export function __gthread_recursive_mutex_unlock(__mutex) {
  return i32(__gthread_mutex_unlock(__mutex));
}

// C/C++ source: source/build/include/mutex.h:40
export function mutex_unlock(mutex) {
  SDL_AtomicUnlock(mutex);
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu\c++\12/bits/gthr-default.h:737
export function __gthread_mutex_destroy(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_destroy(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu\c++\12/bits/gthr-default.h:836
export function __gthread_recursive_mutex_destroy(__mutex) {
  return i32(__gthread_mutex_destroy(__mutex));
}

// C/C++ source: source/build/src/mutex.cpp:28
export function mutex_destroy(mutex) {
  ((mutex).value = i32(0));
}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\x86_64-linux-gnu\c++\12/bits/gthr-default.h:300
export function __gthread_active_p() {
  return i32(1);
}
