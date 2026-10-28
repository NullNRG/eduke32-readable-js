#!/usr/bin/env python3
"""Anonymous/unknown C++ types must not create None-valued linker references."""
import os,sys
from pathlib import Path
sys.path.insert(0,os.environ.get('EDUKE_TEST_COMPILER_DIR') or str(Path(__file__).resolve().parents[2]/'tools'))
from source_ast_to_js import reference_names
untyped={'kind':'CompoundStmt','inner':[{'kind':'CXXConstructExpr','type':{'qualType':'Widget &&'}}]}
assert reference_names(untyped,class_dependencies={None,'Widget'})==set()
known={'kind':'CXXConstructExpr','type':{'qualType':'Widget'}}
assert reference_names(known,class_dependencies={'Widget'})=={'Widget'}
assert reference_names({'kind':'CompoundStmt','inner':[]},class_dependencies={None})==set()
print('PASS: named original class references preserved; anonymous/unknown references never become None exports')
