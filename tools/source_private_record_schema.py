"""Eligibility of already Clang-proven record storage for private fragments.

This is not an ABI layout extractor. The canonical compiler supplies every
offset, extent and field type from Clang; this gate only restricts the runtime
operations which may share an existing owner's private address factory.
"""
import re

NATIVE_WIDTHS={'Int8Array':1,'Uint8Array':1,'Int16Array':2,'Uint16Array':2,
    'Int32Array':4,'Uint32Array':4,'Float32Array':4,'Float64Array':8,
    'BigInt64Array':8,'BigUint64Array':8}

def private_record_schema_compatible(schema):
    """Accept nested numeric unions and disjoint scalar/pointer subobjects.

    Pointer bytes may not overlap ANY other leaf, including a numeric union
    alternative. Such type-punning needs a separate verified pointer ABI.
    Arrays, bitfields, class prototypes and inferred/invalid extents stay out.
    """
    leaves=[];seen=set();count=0
    def integer(value):return type(value) is int
    def visit(record,base,depth):
        nonlocal count
        count+=1
        if count>4096 or depth>16 or not isinstance(record,dict) or id(record) in seen:return False
        seen.add(id(record))
        try:
            if set(record)-{'size','align','arrayAlign','fields','union','overlaps'}:return False
            size=record.get('size');alignment=record.get('align')
            if (not integer(size) or size<1 or size>1048576 or not integer(alignment)
                    or alignment<1 or alignment&(alignment-1) or size%alignment):return False
            if type(record.get('union')) is not bool or type(record.get('overlaps')) is not bool:return False
            if record.get('arrayAlign') is not None and (not integer(record['arrayAlign']) or record['arrayAlign']<1
                    or record['arrayAlign']&(record['arrayAlign']-1)):return False
            fields=record.get('fields')
            if not isinstance(fields,dict):return False
            ranges=[]
            for name,field in fields.items():
                if (not isinstance(name,str) or not re.fullmatch(r'[A-Za-z_]\w*',name)
                        or name in ('__proto__','constructor','prototype') or not isinstance(field,dict)):return False
                offset=field.get('offset')
                if not integer(offset) or offset<0 or record['union'] and offset!=0:return False
                if 'byteRecord' in field:
                    if set(field)-{'offset','size','byteRecord'}:return False
                    child=field['byteRecord']
                    if not isinstance(child,dict):return False
                    width=child.get('size')
                    if 'size' in field and (not integer(field['size']) or field['size']!=width):return False
                    if not visit(child,base+offset,depth+1):return False
                    if child['overlaps'] and not record['overlaps']:return False
                elif 'native' in field:
                    if set(field)!={'offset','size','native'}:return False
                    width=NATIVE_WIDTHS.get(field['native'])
                    if not width or not integer(field['size']) or field['size']!=width:return False
                    leaves.append((base+offset,base+offset+width,False))
                elif field.get('pointer') is True:
                    if set(field)!={'offset','size','pointer'} or not integer(field['size']) or field['size']!=8:return False
                    width=8
                    leaves.append((base+offset,base+offset+width,True))
                else:return False
                if not integer(width) or width<1 or offset+width>size:return False
                overlaps=any(offset<end and start<offset+width for start,end in ranges)
                if overlaps and (not record['union'] or not record['overlaps']):return False
                ranges.append((offset,offset+width))
            return True
        finally:seen.remove(id(record))
    if not visit(schema,0,0):return False
    for index,(start,end,pointer) in enumerate(leaves):
        for other_start,other_end,other_pointer in leaves[index+1:]:
            if (pointer or other_pointer) and start<other_end and other_start<end:return False
    return True
