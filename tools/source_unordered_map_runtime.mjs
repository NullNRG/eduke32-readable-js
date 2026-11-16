// Standard-library service for opaque std::unordered_map objects. Original
// game functions still execute their source-lowered bodies. These managed
// objects do not claim a native byte layout or permit raw serialization.
const cStdUnordered = (() => {
  const key=Symbol.for('source-first.std-unordered-map/1');
  const state=globalThis[key]||(globalThis[key]={maps:new WeakMap(),iterators:new WeakMap(),globals:new Map()});
  const scalar=(type,value)=>{
    if(!Number.isInteger(type)||![8,16,32].includes(type))throw TypeError('Unsupported unordered_map unsigned scalar');
    if(typeof value==='bigint')return Number(BigInt.asUintN(type,value));
    if(typeof value!=='number'||!Number.isFinite(value)||!Number.isInteger(value))throw TypeError('Unordered map requires an integral converted value');
    return type===32?Number(value)>>>0:Number(value)&(2**type-1);
  };
  const schemaKey=schema=>JSON.stringify(schema);
  const checkSchema=schema=>{
    if(!schema||!Number.isInteger(schema.key)||![8,16,32].includes(schema.key))throw TypeError('Unverified unordered_map key type');
    if(typeof schema.value==='number')scalar(schema.value,0);else checkSchema(schema.value);
  };
  const mapInfo=object=>{
    if(object?.__cReference===true)object=object.value;
    const info=state.maps.get(object);
    if(!info||!info.live)throw TypeError('Unordered map object is absent or destroyed');
    return info;
  };
  const nodeInfo=(owner,node)=>{
    const info=mapInfo(owner);
    if(!node||!node.live||info.nodes.get(node.key)!==node)throw RangeError('Unordered map element lifetime ended');
    return node;
  };
  const iterator=(owner,node)=>{
    const value={};state.iterators.set(value,{owner,node});return value;
  };
  const iteratorInfo=value=>{
    const info=state.iterators.get(value);
    if(!info)throw TypeError('Unverified unordered map iterator');
    mapInfo(info.owner);if(info.node)nodeInfo(info.owner,info.node);return info;
  };
  const build=schema=>{
    checkSchema(schema);
    const object={},info={object,schema:JSON.parse(schemaKey(schema)),nodes:new Map(),live:true,address:null};
    state.maps.set(object,info);
    info.address={__cReference:true,get value(){mapInfo(object);return object;},set value(_){throw TypeError('Container address cannot be rebound');}};
    Object.defineProperty(object,'__sourceStdDestroy',{value(){destroy(object);}});
    return object;
  };
  const empty=object=>{
    const info=mapInfo(object);
    for(const node of info.nodes.values()){
      if(typeof info.schema.value!=='number')destroy(node.value);
      node.live=false;
    }
    info.nodes.clear();
  };
  const destroy=object=>{const info=mapInfo(object);empty(object);info.live=false;};
  const copyValue=(schema,value)=>typeof schema==='number'?scalar(schema,value):copy(value,schema);
  const insert=(object,key,value,hasValue)=>{
    const info=mapInfo(object);key=scalar(info.schema.key,key);
    let node=info.nodes.get(key);
    if(node)return {node,inserted:false};
    node={key,live:true,value:undefined,reference:null,pair:null};
    node.value=hasValue?copyValue(info.schema.value,value):(typeof info.schema.value==='number'?0:build(info.schema.value));
    node.reference={__cReference:true,get value(){return nodeInfo(object,node).value;},set value(value){
      nodeInfo(object,node);
      if(typeof info.schema.value==='number')node.value=scalar(info.schema.value,value);
      else assign(node.value,value);
    }};
    if(typeof info.schema.value!=='number')state.maps.get(node.value).address=node.reference;
    node.pair={get first(){nodeInfo(object,node);return key;},get second(){return node.reference.value;},set second(value){node.reference.value=value;}};
    info.nodes.set(key,node);return {node,inserted:true};
  };
  const copy=(source,expected)=>{
    const info=mapInfo(source);
    if(expected&&schemaKey(expected)!==schemaKey(info.schema))throw TypeError('Unordered map copy type differs');
    const result=build(info.schema);
    try{for(const node of info.nodes.values())insert(result,node.key,node.value,true);return result;}
    catch(error){destroy(result);throw error;}
  };
  const assign=(target,source)=>{
    const to=mapInfo(target),from=mapInfo(source);
    if(schemaKey(to.schema)!==schemaKey(from.schema))throw TypeError('Unordered map assignment type differs');
    if(target===source)return target;
    // Finish copies before invalidating the original target's references.
    const temporary=copy(source);empty(target);
    const copied=mapInfo(temporary);
    try{for(const node of copied.nodes.values())insert(target,node.key,node.value,true);return target;}
    finally{destroy(temporary);}
  };
  state.releaseHeap=heap=>{
    const scope=state.globals.get(heap);if(!scope)return;
    state.globals.delete(heap);
    for(let i=scope.length-1;i>=0;i--)destroy(scope[i]);
  };
  return Object.freeze({
    create:build,copy,assign,destroy,clear:empty,
    global(object){const heap=globalThis[Symbol.for('source-first.native-C-heap/2')];let scope=state.globals.get(heap);if(!scope)state.globals.set(heap,scope=[]);scope.push(object);return object;},
    address(object){return mapInfo(object).address;},
    deref(reference){const object=reference?.__cReference===true?reference.value:reference;mapInfo(object);return object;},
    slot(object,key){return insert(object,key,undefined,false).node.reference;},
    emplace(object,key,value){const result=insert(object,key,value,true);return {first:iterator(object,result.node),second:result.inserted};},
    find(object,key){const info=mapInfo(object);return iterator(object,info.nodes.get(scalar(info.schema.key,key))||null);},
    end(object){mapInfo(object);return iterator(object,null);},
    begin(object){const info=mapInfo(object);return iterator(object,info.nodes.values().next().value||null);},
    size(object){return mapInfo(object).nodes.size;},
    erase(object,key){const info=mapInfo(object),node=info.nodes.get(scalar(info.schema.key,key));if(!node)return 0;if(typeof info.schema.value!=='number')destroy(node.value);node.live=false;info.nodes.delete(node.key);return 1;},
    iteratorCopy(value){const info=iteratorInfo(value);return iterator(info.owner,info.node);},
    iteratorEqual(left,right){const a=iteratorInfo(left),b=iteratorInfo(right);if(a.owner!==b.owner)throw TypeError('Comparing iterators from different containers');return a.node===b.node;},
    iteratorPair(value){const info=iteratorInfo(value);return nodeInfo(info.owner,info.node).pair;},
    iteratorNext(value){const info=iteratorInfo(value);if(!info.node)throw RangeError('Incrementing unordered map end');const values=mapInfo(info.owner).nodes.values();let next;while(!(next=values.next()).done)if(next.value===info.node)break;info.node=values.next().value||null;return value;},
  });
})();
