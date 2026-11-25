"""Read generated ES module bindings, including exact same-directory aliases."""
import re

DIRECT = re.compile(r'^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)\b', re.M)
REEXPORT = re.compile(r'^export\s*\{([^}]*)\}\s*from\s*["\'](\./_source_(?:legacy|storage)_[^"\']+)["\'];?$', re.M)
IDENTIFIER = r'[A-Za-z_$][\w$]*'
SPECIFIER = re.compile(rf'({IDENTIFIER})(?:\s+as\s+({IDENTIFIER}))?')


def fragment_exports(module, *, strict=False):
    def read(path, parents):
        path = path.resolve()
        if path in parents or not path.is_file():
            return set()
        text = path.read_text(encoding='utf-8')
        available = set(DIRECT.findall(text))
        for group, name in REEXPORT.findall(text):
            target = (path.parent / name).resolve()
            parts = [SPECIFIER.fullmatch(part.strip()) for part in group.split(',')]
            if (target.parent != path.parent or not target.is_file()
                    or not all(parts)):
                if strict:
                    raise RuntimeError('Invalid or missing verified source shard: ' + name)
                continue
            original = read(target, parents | {path})
            if not all(part[1] in original for part in parts):
                if strict:
                    raise RuntimeError('Reexport not backed by original generated source: ' + name)
                continue
            available.update(part[2] or part[1] for part in parts)
        return available

    return read(module, set())
