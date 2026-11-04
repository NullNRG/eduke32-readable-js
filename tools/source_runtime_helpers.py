"""Read dual-use ES helpers for embedding without their module wiring."""
import hashlib,re
from pathlib import Path
def embedded(path):
    text=Path(path).read_text(encoding='utf-8')
    text=re.sub(r'''(?m)^import \{[^;\n]+\} from ["'][^"']+["'];\r?\n?''','',text)
    return re.sub(r'(?m)^export \{[^;\n]+\};\r?\n?','',text)

def runtime_fingerprints(root):
    """Attest runtime modules plus their actual relative ES-module imports."""
    root=Path(root).resolve();pending=[*sorted((root/'runtime').rglob('*.mjs')),root/'tools/source_address_runtime.mjs']
    seen=set()
    while pending:
        path=pending.pop().resolve()
        if path in seen:continue
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError('Runtime dependency escapes or is absent: '+str(path))
        seen.add(path)
        for spec in re.findall(r'''(?:\bfrom\s*|\bimport\s*)["'](\.[^"']+)["']''',path.read_text(encoding='utf-8')):
            dependency=(path.parent/spec).resolve()
            if dependency.suffix=='.mjs':pending.append(dependency)
    return {p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(seen)}
