"""Read an existing original full-TU AST cache; never recompile or alter inputs."""
import gzip,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'work/dependencies/browser-python'))
import ijson
cache=ROOT/'work/ast/f3f73c89e7558265637b0512990774fe2bdcc6ec733701b88b4869ed0334ea68/shard-00/full-types-4fea1b0624d3d331559f4ac7cfb733abab7d013a1dadf1fcb84fb48f6c137711.json.gz'
with gzip.open(cache,'rb') as stream:
    for record in ijson.items(stream,'inner.item'):
        if record.get('kind')!='CXXRecordDecl' or record.get('name')!='AtomicLogString' or not record.get('completeDefinition'):continue
        selected={key:record[key] for key in ('id','kind','loc','range','name','definitionData','bases') if key in record}
        selected['inner']=[node for node in record.get('inner',[]) if node.get('kind') in ('FieldDecl','CXXConstructorDecl','CXXDestructorDecl')]
        (ROOT/'work/original-atomic-log-constructor-ast.json').write_text(json.dumps(selected,indent=2,default=str)+'\n')
        print(json.dumps({'name':record['name'],'bases':record.get('bases'),
            'constructors':[{'type':node.get('type'),'defaulted':node.get('explicitlyDefaulted'),
                'children':[child.get('kind') for child in node.get('inner',[])]}
                for node in selected['inner'] if node.get('kind')=='CXXConstructorDecl']},indent=2))
        break
    else:raise RuntimeError('Original logging node not found in the selected source cache')
