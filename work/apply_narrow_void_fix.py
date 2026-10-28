from pathlib import Path
p=Path('tools/source_ast_to_js.py');s=p.read_text()
a="        if k=='CStyleCastExpr' or k in ('CXXStaticCastExpr','CXXFunctionalCastExpr','CXXReinterpretCastExpr'):";assert s.count(a)==1
s=s.replace(a,a+'''
            if qual(n)=='void' and len(a)==1:
                # A discarded pure pointer calculation is not a memory read.
                # This includes disabled prefetch hints in original headers;
                # keep calls, volatile reads and all mutations executable.
                def pure(part):
                    tag=kind(part)
                    if re.search(r'\\bvolatile\\b',qual(part)):return False
                    if tag in ('DeclRefExpr','IntegerLiteral','CharacterLiteral','CXXNullPtrLiteralExpr'):
                        return not kids(part)
                    if tag in ('ImplicitCastExpr','ParenExpr','ConstantExpr','CStyleCastExpr'):
                        return len(kids(part))==1 and pure(kids(part)[0])
                    if tag=='BinaryOperator' and part.get('opcode') in ('+','-','*','&','|','^','<<','>>'):
                        return len(kids(part))==2 and all(pure(v) for v in kids(part))
                    if tag=='UnaryOperator' and part.get('opcode') in ('+','-','~','!'):
                        return len(kids(part))==1 and pure(kids(part)[0])
                    return False
                if pure(a[0]):return 'void 0'
''')
s=s.replace('const i32 = value => Number(value) | 0;', "const i32 = value => typeof value === 'bigint' ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;")
s=s.replace('const u32 = value => Number(value) >>> 0;', "const u32 = value => typeof value === 'bigint' ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;")
# These JS snippets are inside Python single-quoted strings.
s=s.replace("typeof value === 'bigint'",'typeof value === "bigint"')
compile(s,str(p),'exec');p.write_text(s,encoding='utf-8',newline='\n')
