#!/usr/bin/env python3
"""Recover Make-generated C++ shader translation units from ORIGINAL GLSL inputs.

The EDuke32 GNUmakefile recipe for obj/<group>/<name>.glsl.cpp is:
  extern char const *<name>;
  char const *<name> = R"shader(<GLSL bytes>)shader";
No shader is synthesized: original bytes, names, and provenance are required.
"""
from __future__ import annotations
import hashlib
import os
from pathlib import Path
import re

NAME = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')
RULE = '$$(call RAW_ECHO,char const *$$(basename $$(<F)) = R"shader$$(paren_open))'

def recover(source_root: Path, missing: list[str]) -> list[dict]:
    source_root = source_root.resolve()
    makefile = source_root/'GNUmakefile'
    if not makefile.is_file() or RULE not in makefile.read_text(encoding='utf-8'):
        return []  # Never guess code for an unverified build recipe.
    rows = []
    for name in missing:
        path = Path(name)
        if (path.is_absolute() or '..' in path.parts or len(path.parts) != 3
            or path.parts[0] != 'obj' or not name.endswith('.glsl.cpp')):
            continue
        symbol = path.name[:-len('.glsl.cpp')]
        if not NAME.fullmatch(symbol): continue
        group = path.parts[1]
        # Discover the original Make input in the matching source group only.
        source = source_root/'source'/group/'src'/(symbol+'.glsl')
        if not source.is_file(): continue
        shader = source.read_bytes()
        if b')shader"' in shader or b'\x00' in shader:
            raise ValueError(f'unsafe raw-string delimiter or embedded NUL: {source}')
        target = source_root/path
        result = (f'extern char const *{symbol};\nchar const *{symbol} = R"shader('.encode()
                  + shader + b')shader";\n')
        if target.is_file():
            if target.read_bytes() != result:
                raise ValueError(f'GLSL generated unit does not match original GNUmakefile: {target}')
            action='verified-existing'
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            temp = target.with_suffix(target.suffix + '.tmp')
            temp.write_bytes(result)
            os.replace(temp, target)
            action='recovered'
        rows.append({
            'action':action,
            'source': name,
            'make_input': str(source.relative_to(source_root)),
            'make_rule': 'GNUmakefile GLSL raw-string C++ translation-unit rule',
            'input_sha256': hashlib.sha256(shader).hexdigest(),
            'generated_sha256': hashlib.sha256(result).hexdigest(),
            'generated_bytes': len(result),
        })
    return rows
