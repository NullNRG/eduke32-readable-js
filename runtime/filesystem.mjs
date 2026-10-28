/** In-memory case-insensitive filesystem with original BUILD .GRP support.
 * Archive bytes stay read-only; writable files are an independent overlay.
 */
export class VirtualFS {
  constructor() { this.files = new Map(); this.overlays = new Map(); this.mounts = []; this.searchPaths = []; }
  static key(path) {
    if (typeof path !== 'string') throw new TypeError('Path must be string');
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
    const result = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') { if (!result.length) throw new Error('Path traversal'); result.pop(); }
      else result.push(part);
    }
    return result.join('/').toLowerCase();
  }
  mountBytes(name, bytes) {
    const key = VirtualFS.key(name);
    if (key.length === 0) throw new Error('Cannot mount empty filename');
    this.files.set(key, new Uint8Array(bytes));
  }
  mountGRP(array, prefix = '') {
    // Keep the original mounted archive as read-only backing storage instead of
    // duplicating the entire GRP before taking per-entry subarray views.
    // The host must not mutate the passed array while the archive is mounted.
    const bytes = array instanceof Uint8Array ? array : new Uint8Array(array);
    const text = new TextDecoder('ascii');
    if (bytes.length < 16 || text.decode(bytes.slice(0, 12)) !== 'KenSilverman') throw new Error('Invalid BUILD GRP signature');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint32(12, true);
    if (count > 100_000 || 16 + count * 16 > bytes.length) throw new Error('Invalid GRP directory size');
    let offset = 16 + 16 * count;
    const directory = [];
    for (let i = 0; i < count; i++) {
      const p = 16 + i * 16;
      const rawName = text.decode(bytes.slice(p, p + 12)).replace(/\0.*$/, '').trim();
      const length = view.getUint32(p + 12, true);
      if (offset + length > bytes.length) throw new Error('GRP file extends outside archive: ' + rawName);
      const key = VirtualFS.key((prefix ? prefix + '/' : '') + rawName);
      // Later archives override earlier by the rules of the virtual mount order.
      this.files.set(key, bytes.subarray(offset, offset + length));
      directory.push({ name: key, length, offset });
      offset += length;
    }
    this.mounts.push({ prefix, count, directory });
    return directory;
  }
  /** Search paths are ordered newest first, as in Build's addsearchpath_user.
   * Read resolution checks the requested name first, then registered mounts;
   * writes always use the explicit path to avoid mutating read-only archives.
   */
  addSearchPath(path, user=0) {
    const prefix=VirtualFS.key(path);
    this.searchPaths.unshift({prefix,user:user|0});
  }
  removeSearchPathsWithUser(mask) {
    this.searchPaths=this.searchPaths.filter(row=>(row.user&(mask|0))===0);
  }
  resolveFileKey(path) {
    const key=VirtualFS.key(path);
    if(this.overlays.has(key)||this.files.has(key)) return key;
    // Leading slash denotes a direct VFS path, not a search-path lookup.
    if(typeof path==='string' && path.startsWith('/')) return key;
    for(const {prefix} of this.searchPaths) {
      const candidate=prefix?prefix+'/'+key:key;
      if(this.overlays.has(candidate)||this.files.has(candidate))return candidate;
    }
    return key;
  }
  exists(path) { const key = this.resolveFileKey(path); return this.overlays.has(key) || this.files.has(key); }
  // Read-only file metadata and ranged I/O do not copy entire GRP archives.
  // An archive entry may be tens of megabytes; every stat/lseek/read in the
  // translated C code must not duplicate the full backing buffer.
  #backing(path) {
    const key = this.resolveFileKey(path);
    const value = this.overlays.get(key) ?? this.files.get(key);
    if (!value) throw new Error('ENOENT: ' + path);
    return value;
  }
  size(path) { return this.#backing(path).byteLength; }
  readInto(path, offset, target, targetOffset=0, count=target.byteLength-targetOffset) {
    const data = this.#backing(path);
    if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(targetOffset)||targetOffset<0||
       !Number.isSafeInteger(count)||count<0||targetOffset+count>target.byteLength)
      throw RangeError('Invalid ranged file read');
    const n=Math.min(count,Math.max(0,data.byteLength-offset));
    target.set(data.subarray(offset,offset+n),targetOffset);
    return n;
  }
  readFile(path) { return this.#backing(path).slice(); }
  writeFile(path, data) { this.overlays.set(VirtualFS.key(path), new Uint8Array(data).slice()); }
  remove(path) { return this.overlays.delete(VirtualFS.key(path)); }
  list(prefix = '') {
    const key = VirtualFS.key(prefix);
    return Array.from(new Set([...this.files.keys(), ...this.overlays.keys()])).filter(x => x.startsWith(key)).sort();
  }
}
