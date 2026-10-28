/** Browser bindings designed for imported engine systems, not generated code patches. */
export class BrowserPlatform {
  constructor(canvas = null) {
    this.canvas = canvas;
    this.keys = new Set(); this.buttons = new Set();
    this.pointer = { x: 0, y: 0, dx: 0, dy: 0 };
    this.audio = null; this.closed = false; this.listeners = [];
  }
  now() { return globalThis.performance?.now?.() ?? Date.now(); }
  on(target, kind, handler, options) {
    target.addEventListener(kind, handler, options);
    this.listeners.push(() => target.removeEventListener(kind, handler, options));
  }
  attach() {
    if (!globalThis.window || !this.canvas) return;
    this.canvas.tabIndex = 0;
    this.on(window, 'keydown', e => { this.keys.add(e.code); if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); });
    this.on(window, 'keyup', e => this.keys.delete(e.code));
    this.on(window, 'blur', () => { this.keys.clear(); this.buttons.clear(); });
    this.on(this.canvas, 'pointerdown', e => { this.buttons.add(e.button); this.canvas.focus(); });
    this.on(window, 'pointerup', e => this.buttons.delete(e.button));
    this.on(window, 'pointermove', e => {
      this.pointer.x = e.clientX; this.pointer.y = e.clientY;
      this.pointer.dx += e.movementX || 0; this.pointer.dy += e.movementY || 0;
    });
    this.on(this.canvas, 'contextmenu', e => e.preventDefault());
    this.on(window, 'gamepadconnected', () => {});
  }
  pollInput() {
    const snapshot = { keys: new Set(this.keys), buttons: new Set(this.buttons), pointer: { ...this.pointer }, gamepads: [] };
    this.pointer.dx = this.pointer.dy = 0;
    const pads = globalThis.navigator?.getGamepads?.() || [];
    snapshot.gamepads = Array.from(pads).filter(Boolean).map(p => ({ axes: Array.from(p.axes), buttons: p.buttons.map(b => b.value), id: p.id }));
    return snapshot;
  }
  async resumeAudio() {
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) throw new Error('WebAudio not supported');
    if (!this.audio) this.audio = new Context();
    await this.audio.resume(); return this.audio;
  }
  playPCM(samples, sampleRate = 22050) {
    if (!this.audio) throw new Error('Call resumeAudio after user interaction');
    const buf = this.audio.createBuffer(1, samples.length, sampleRate);
    buf.copyToChannel(samples, 0);
    const src = this.audio.createBufferSource();
    src.buffer = buf; src.connect(this.audio.destination); src.start();
    return src;
  }
  requestFrame(cb) {
    if (this.closed) throw new Error('Platform already destroyed');
    if (globalThis.requestAnimationFrame) return requestAnimationFrame(cb);
    return setTimeout(() => cb(this.now()), 16);
  }
  cancelFrame(id) {
    if (globalThis.cancelAnimationFrame) cancelAnimationFrame(id);
    else clearTimeout(id);
  }
  destroy() {
    this.closed = true; this.listeners.splice(0).forEach(f => f());
    this.audio?.close?.(); this.audio = null;
  }
}
