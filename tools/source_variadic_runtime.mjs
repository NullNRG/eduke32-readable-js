// Clang x86-64 SysV va_list ABI: represented as an owned native JS cursor.
// No native stack/register emulation. The C caller has already passed the
// promoted arguments as JavaScript values. This is a function-call adapter.
const cVariadic = Object.freeze({
  empty() { return {__cVaList: true, values: null, index: 0, ended: false}; },
  check(list) {
    if (!list || list.__cVaList !== true || list.ended)
      throw new TypeError('invalid or ended C va_list');
  },
  start(list, arguments_) {
    cVariadic.check(list);
    if (list.values !== null || !Array.isArray(arguments_))
      throw new TypeError('va_start requires uninitialized cursor and original arguments');
    list.values = arguments_;
    list.index = 0;
  },
  next(list) {
    cVariadic.check(list);
    if (!Array.isArray(list.values) || list.index >= list.values.length)
      throw new RangeError('va_arg exhausted original C variadic arguments');
    return list.values[list.index++];
  },
  copy(destination, source) {
    cVariadic.check(destination);
    cVariadic.check(source);
    if (!Array.isArray(source.values)) throw new TypeError('va_copy source has no va_start');
    destination.values = source.values;
    destination.index = source.index;
  },
  end(list) {
    cVariadic.check(list);
    if (!Array.isArray(list.values))throw new TypeError('va_end without va_start');
    list.values = null;
    list.ended = true;
  }
});
