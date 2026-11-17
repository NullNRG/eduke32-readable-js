"""Bind Clang-evaluated offsets and non-ODR booleans to original array initializers."""
from collections import defaultdict
from pathlib import Path
import ctypes


def authored_globals(ast, source):
    """Descend only declaration scopes, never function or template bodies."""
    for n in ast:
        if n.get('kind') in ('TranslationUnitDecl', 'NamespaceDecl', 'LinkageSpecDecl'):
            yield from authored_globals(n.get('inner', ()), source)
        elif n.get('kind') == 'VarDecl' and n.get('init') and n.get('name'):
            loc = n.get('loc', {})
            if ('offset' in loc and 'includedFrom' not in loc and
                    (not loc.get('file') or Path(loc['file']).as_posix() == source)):
                yield n


def nodes(n):
    yield n
    for child in (*n.get('inner', ()), *n.get('array_filler', ())):
        if child:
            yield from nodes(child)


class OffsetConstants:
    def __init__(self, root, source, args):
        self.root = root
        self.source = source
        self.args = args
        self.values = None
        self.report = {'attempted': False, 'matched': 0}

    def bind(self, ast):
        groups = defaultdict(list)
        for decl in authored_globals(ast, self.source):
            for n in nodes(decl):
                kind = n.get('kind')
                ref = n.get('referencedDecl', {})
                typ = n.get('type', {}).get('desugaredQualType', n.get('type', {}).get('qualType'))
                if kind == 'OffsetOfExpr':
                    binding = 'offsetof'
                elif (kind == 'DeclRefExpr' and n.get('nonOdrUseReason') == 'constant' and
                      ref.get('kind') == 'VarDecl' and typ == 'const bool' and ref.get('name')):
                    binding = 'bool:' + ref['name']
                else:
                    continue
                loc = n.get('range', {}).get('begin', {})
                loc = loc.get('expansionLoc', loc)
                if 'offset' not in loc or 'includedFrom' in loc:
                    continue
                if loc.get('file') and Path(loc['file']).as_posix() != self.source:
                    continue
                key = decl['name'], decl['loc']['offset'], loc['offset'], typ, binding
                groups[key].append(n)
        if not groups:
            return
        if self.values is None:
            self.report['attempted'] = True
            try:
                self.values = self.evaluate()
            except (ImportError, OSError, RuntimeError, ValueError) as exc:
                self.values = {}
                self.report['error'] = str(exc)
        matched = defaultdict(int)
        for key, candidates in groups.items():
            # A macro can produce several offsets at one expansion location.
            # Neither frontend promises an interoperable ordinal for them.
            unique_nodes = {n.get('id') or id(n) for n in candidates}
            results = self.values.get(key, ())
            if len(unique_nodes) != 1 or len(results) != 1:
                continue
            for n in candidates:
                n['_source_evaluated_array_constant'] = results[0]
            matched['offsets' if key[-1] == 'offsetof' else 'booleans'] += 1
        self.report.update(requested=len(groups), matched=sum(matched.values()), by_kind=dict(matched))

    def evaluate(self):
        from clang import cindex as c
        from source_semantic_index import extraction_resource_config

        resources = extraction_resource_config(c)
        source = self.root / self.source
        args = [*self.args, '-working-directory', str(self.root),
                '-resource-dir', resources['resource_dir']]
        try:
            tu = c.Index.create().parse(str(source), args=args)
        except c.TranslationUnitLoadError as exc:
            raise ValueError('Clang could not load the translation unit for offset evaluation') from exc
        errors = [str(d) for d in tu.diagnostics if d.severity >= c.Diagnostic.Error]
        if errors:
            raise ValueError('Clang offset evaluation could not parse the original source: ' + errors[0])
        lib = c.conf.lib
        evaluate = lib.clang_Cursor_Evaluate
        evaluate.argtypes, evaluate.restype = [c.Cursor], ctypes.c_void_p
        result_kind = lib.clang_EvalResult_getKind
        result_kind.argtypes, result_kind.restype = [ctypes.c_void_p], ctypes.c_int
        unsigned_value = lib.clang_EvalResult_getAsUnsigned
        unsigned_value.argtypes, unsigned_value.restype = [ctypes.c_void_p], ctypes.c_uint64
        dispose = lib.clang_EvalResult_dispose
        dispose.argtypes, dispose.restype = [ctypes.c_void_p], None

        def globals_in(scope):
            for cursor in scope.get_children():
                if not cursor.location.file or Path(cursor.location.file.name) != source:
                    continue
                if cursor.kind in (c.CursorKind.NAMESPACE, c.CursorKind.LINKAGE_SPEC, c.CursorKind.UNEXPOSED_DECL):
                    yield from globals_in(cursor)
                elif cursor.kind == c.CursorKind.VAR_DECL and cursor.is_definition():
                    yield cursor

        values = defaultdict(list)
        for decl in globals_in(tu.cursor):
            if decl.type.kind != c.TypeKind.CONSTANTARRAY:
                continue
            for expr in decl.walk_preorder():
                typ = expr.type.get_canonical().spelling
                if expr.kind == c.CursorKind.UNEXPOSED_EXPR and typ == 'unsigned long' and expr.type.get_size() == 8:
                    children = list(expr.get_children())
                    # OffsetOfExpr exposes its type and member designators.
                    if not children or children[0].kind not in (c.CursorKind.TYPE_REF, c.CursorKind.TEMPLATE_REF):
                        continue
                    fields = [child for child in children if child.kind == c.CursorKind.MEMBER_REF]
                    if not fields or any(not f.referenced or f.referenced.kind != c.CursorKind.FIELD_DECL for f in fields):
                        continue
                    binding = 'offsetof'
                elif expr.kind == c.CursorKind.DECL_REF_EXPR and typ == 'const bool':
                    ref = expr.referenced
                    if not ref or ref.kind != c.CursorKind.VAR_DECL or ref.storage_class != c.StorageClass.STATIC:
                        continue
                    binding = 'bool:' + ref.spelling
                else:
                    continue
                result = evaluate(expr)
                if result:
                    try:
                        if result_kind(result) == 1:  # CXEval_Int
                            key = decl.spelling, decl.location.offset, expr.location.offset, typ, binding
                            number = unsigned_value(result)
                            if binding == 'offsetof' or number in (0, 1):
                                values[key].append(number)
                    finally:
                        dispose(result)
        self.report['frontend'] = resources['libclang_version']
        self.report['resource_sha256'] = resources['resource_sha256']
        return values
