"""Incremental, dependency-free JSON event tokenizer for Clang AST dumps.

Reads a bounded UTF-8 chunk at a time and yields the exact `basic_parse`
start/end/key/scalar event vocabulary consumed by source_ast_stream. It does
not materialize a JSON document or discard AST nodes. It is intentionally
strict about separators, escaping, JSON numbers and trailing garbage.
"""
from decimal import Decimal
from json.decoder import scanstring
import re

_NUMBER = re.compile(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?')
_WS = frozenset(' \n\r\t')


def _tokens(stream):
    # Incremental decoder permits a multibyte UTF-8 character to cross a read.
    import codecs
    decoder = codecs.getincrementaldecoder('utf-8')(errors='strict')
    buf = ''; position = 0; eof = False

    def refill():
        nonlocal buf, position, eof
        if eof: return False
        chunk = stream.read(65536)
        if not chunk:
            new = decoder.decode(b'', final=True)
            eof = True
        else:
            new = decoder.decode(chunk)
        buf = buf[position:] + new
        position = 0
        return bool(new) or not eof

    while True:
        if position >= len(buf):
            if not refill(): break
            continue
        c = buf[position]
        if c in _WS:
            position += 1
            continue
        if c in '{}[]:,':
            position += 1
            yield c, None
            continue
        if c == '"':
            # json.decoder.scanstring is a fast, standard-library UTF-8-safe
            # string decoder, including escaped Unicode and surrogate pairs.
            while True:
                try:
                    value, end = scanstring(buf, position + 1, True)
                    break
                except ValueError as exc:
                    if eof: raise ValueError('Invalid or unfinished JSON string') from exc
                    if not refill(): raise ValueError('Invalid or unfinished JSON string') from exc
            position = end
            yield 'string', value
            continue
        if c in '-0123456789':
            while True:
                match = _NUMBER.match(buf, position)
                if not match: raise ValueError('Invalid JSON number')
                if match.end() < len(buf) or eof: break
                if not refill(): break
            value = match.group()
            position = match.end()
            yield 'number', Decimal(value) if ('.' in value or 'e' in value.lower()) else int(value)
            continue
        if c in 'tfn':
            for literal, value, event in (('true', True, 'boolean'),('false', False, 'boolean'),('null', None, 'null')):
                if c != literal[0]: continue
                while len(buf) - position < len(literal) and not eof:
                    if not refill(): break
                if not buf.startswith(literal, position):
                    raise ValueError('Invalid JSON literal')
                position += len(literal)
                yield event, value
                break
            continue
        raise ValueError('Unexpected JSON character '+repr(c))


def basic_parse(stream):
    """Validate JSON grammar, and emit basic_parse-compatible events.

    Multiple consecutive Clang AST roots are supported. Stack depth is
    explicit, not tied to Python recursion limits.
    """
    stack = []
    root_done = False
    for token, value in _tokens(stream):
        if not stack:
            if token not in ('{','['):
                raise ValueError('Clang AST root must be an object or array')
            if token == '{':
                stack.append(['object', 'first-key'])
                yield 'start_map', None
            else:
                stack.append(['array', 'first-value'])
                yield 'start_array', None
            root_done = True
            continue
        frame = stack[-1]
        kind, status = frame
        if kind == 'object' and status in ('first-key', 'key'):
            if token == '}' and status == 'first-key':
                stack.pop(); yield 'end_map', None
                continue
            if token != 'string': raise ValueError('Expected JSON object property name')
            frame[1] = 'colon'
            yield 'map_key', value
            continue
        if kind == 'object' and status == 'colon':
            if token != ':': raise ValueError('Expected JSON colon')
            frame[1] = 'value'
            continue
        if status == 'comma-or-end':
            if token == ',':
                frame[1] = 'key' if kind == 'object' else 'value'
                continue
            if token == ('}' if kind == 'object' else ']'):
                stack.pop()
                yield 'end_map' if kind == 'object' else 'end_array', None
                continue
            raise ValueError('Expected JSON comma or close')
        if kind == 'array' and status == 'first-value' and token == ']':
            stack.pop(); yield 'end_array', None
            continue
        if status not in ('value','first-value'): raise ValueError('Invalid JSON object state')
        frame[1] = 'comma-or-end'
        if token == '{':
            stack.append(['object', 'first-key']); yield 'start_map', None
        elif token == '[':
            stack.append(['array', 'first-value']); yield 'start_array', None
        elif token in ('string','number','boolean','null'):
            yield token, value
        else:
            raise ValueError('Expected JSON value')
    if stack: raise ValueError('Truncated JSON AST')
    if not root_done: raise ValueError('Empty JSON AST')
