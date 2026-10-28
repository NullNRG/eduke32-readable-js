from pathlib import Path
p=Path('tools/source_ast_to_js.py');s=p.read_text()
s=s.replace("    if dims:\n        if not numeric_type", "    if dims:\n        record=records.get(normalized_record_name(base,aliases),{})\n        if record.get('byte_schema') and all(0<v<=1000000 for v in dims):\n            return {'recordArray':record['byte_schema'],'dims':dims}\n        if not numeric_type",1)
s=s.replace("    if schema.get('byteRecord'):result.update(schema_prototypes(schema['byteRecord']))", "    if schema.get('byteRecord'):result.update(schema_prototypes(schema['byteRecord']))\n    if schema.get('recordArray'):result.update(schema_prototypes(schema['recordArray']))",1)
s=s.replace("            if schema and 'byteRecord' in schema:\n                return self.byte_record_initializer(schema,n)", "            if schema and 'recordArray' in schema:\n                return self.byte_record_array_initializer(schema,n)\n            if schema and 'byteRecord' in schema:\n                return self.byte_record_initializer(schema,n)",1)
s=s.replace("        if 'byteRecord' in schema:\n            return f'cZeroAggregate", "        if 'byteRecord' in schema or 'recordArray' in schema:\n            return f'cZeroAggregate",1)
s=s.replace("                if pointer_schema and 'pointerArray' in pointer_schema:", "                if pointer_schema and ('pointerArray' in pointer_schema or 'recordArray' in pointer_schema):",1)
s=s.replace("            target=qual(n)\n            enum_name=", """            target=qual(n)
            if target.strip().endswith('*'):
                base=normalized_record_name(target.strip()[:-1],self.type_aliases)
                record=self.global_storage_records.get(base,{})
                if record.get('byte_schema'):
                    shape={'byteRecord':record['byte_schema']}
                    return ('cRecordPointer('+self.expr(a[0])+', '+json.dumps(record['byte_schema'],sort_keys=True)
                        +', '+self.byte_record_prototypes(shape)+')')
            enum_name=""",1)
s=s.replace("'cPointerElementRef(', 'cUMullOverflow(')", "'cPointerElementRef(', 'cUMullOverflow(', 'cRecordPointer(')",1)
s=s.replace("'cByteRecordArray(', 'cPointerArray(')", "'cByteRecordArray(', 'cByteRecordNDArray(', 'cRecordPointer(', 'cPointerArray(')",1)
s=s.replace("                      +'  if (source?.__cPointer === true) {\\n'", "                      +'  if (source?.__cRecordPointer === true) return globalThis[Symbol.for(\"source-first.record-pointer-views/1\")].deref(source);\\n'\n                      +'  if (source?.__cPointer === true) {\\n'",1)
s=s.replace('const cObjectFieldRef = (owner, field) => { const key=', 'const cObjectFieldRef = (owner, field) => { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=',1)
# Explicit initializers and every row use the same backing allocation.
s=s.replace("            if len(dims)==1 and 'byteRecord' in element_schema and (\n                original_initializer is None or\n                kind(original_initializer)=='CXXConstructExpr' and not kids(original_initializer)):\n                return 'cByteRecordArray('+json.dumps(element_schema['byteRecord'],sort_keys=True)+f', {dims[0]}, '+(emitter or Emit()).byte_record_prototypes(element_schema)+')'", """            if 'byteRecord' in element_schema:
                em=emitter or Emit()
                return em.byte_record_array_initializer({'recordArray':element_schema['byteRecord'],'dims':dims},original_initializer)""",1)
marker='    def byte_record_initializer(self,schema,node):'
method='''    def byte_record_array_initializer(self,schema,node):
        def values(current,dims):
            if current is None or kind(current)=='ImplicitValueInitExpr' or (kind(current)=='CXXConstructExpr' and not kids(current)):
                return '[]'
            if kind(current)!='InitListExpr':raise Unsupported('record array requires original list initializer')
            items=kids(current);filler=current.get('array_filler')
            if filler:
                if items:raise Unsupported('record array has ambiguous Clang filler')
                zero=filler[0]
                if any(kind(part) not in ('InitListExpr','ImplicitValueInitExpr') for part in descendants(zero)):
                    raise Unsupported('record array has nonzero repeated filler')
                items=filler[1:]
            if len(items)>dims[0]:raise Unsupported('record array initializer exceeds original extent')
            result=[values(item,dims[1:]) if len(dims)>1 else self.byte_record_initializer({'byteRecord':schema['recordArray']},item) for item in items]
            return '['+', '.join(result)+']'
        return ('cByteRecordNDArray('+json.dumps(schema['recordArray'],sort_keys=True)+', '
            +json.dumps(schema['dims'])+', '+self.byte_record_prototypes(schema)+', '+values(node,schema['dims'])+')')

'''
s=s.replace(marker,method+marker,1)
p.write_text(s)
