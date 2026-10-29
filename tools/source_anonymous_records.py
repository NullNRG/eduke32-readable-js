"""Demand discovery for Clang anonymous record storage.

An anonymous record has no identifier suitable for ``-ast-dump-filter``.
Recognizing its location spelling only requests the complete source type AST;
it does not authorize a storage shape. The byte-record extractor must still
join the actual declaration to source bytes and the target's Clang layout.
"""
import re


def blocked_anonymous_global_arrays(report):
    """Return exact anonymous array element spellings needing type closure.

    Require agreement between the original VarDecl type and its storage
    failure. Function pointers, local expressions, unsupported named records,
    and malformed or unbounded arrays cannot trigger this recovery path.
    """
    found=set()
    for row in report:
        if row.get('kind')!='VarDecl' or row.get('status')!='blocked':continue
        reason=row.get('reason','')
        prefix='unsupported global array element type '
        if not reason.startswith(prefix):continue
        element=reason[len(prefix):]
        if not re.fullmatch(r'(?:struct |class |union )?\((?:anonymous|unnamed)'
                            r'(?: (?:struct|class|union))? at .+:\d+:\d+\)',element):
            continue
        declared=row.get('original_type','')
        array=re.fullmatch(r'(.+?)((?:\s*\[\d+\])+)',declared)
        if not array or array[1].strip()!=element:continue
        if any(int(size)<1 for size in re.findall(r'\[(\d+)\]',array[2])):continue
        found.add(element)
    return sorted(found)
