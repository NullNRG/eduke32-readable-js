/** Explicit cross-module symbol binding; all missing externs are diagnosed.
 * Generic C++ name mangling, relocations, vtables, exceptions remain unsupported.
 */
export class SymbolLinker {
  constructor() { this.exports = new Map(); this.modules = new Map(); }
  register(moduleName, symbols) {
    if (this.modules.has(moduleName)) throw new Error('Duplicate module ' + moduleName);
    for (const [key, value] of Object.entries(symbols)) {
      if (typeof value !== 'function' && typeof value !== 'number' && typeof value !== 'bigint') throw new TypeError('Bad exported symbol ' + key);
      if (this.exports.has(key)) throw new Error('Duplicate symbol ' + key + ' (' + moduleName + ' conflicts with ' + this.exports.get(key).module + ')');
      this.exports.set(key, { module: moduleName, value });
    }
    this.modules.set(moduleName, Object.keys(symbols));
  }
  require(symbols) {
    const missing = symbols.filter(name => !this.exports.has(name));
    if (missing.length) throw new Error('Unresolved external symbols: ' + missing.join(', '));
    return Object.fromEntries(symbols.map(name => [name, this.exports.get(name).value]));
  }
  manifest() {
    return { modules: Object.fromEntries(this.modules), totalSymbols: this.exports.size };
  }
}
