/** GNU libstdc++ x86_64 std::_Rb_tree_node_base ABI, color at +0,
 * parent at +8, left +16, right +24. Linked C++ std::map/set tree helpers.
 * Mirrors GNU libstdc++ node insertion and red/black balancing, not a JS Map.
 */
export function createCxxRBTreeABI({heap}={}) {
  if (!heap) throw TypeError('GNU C++ red-black tree ABI requires heap');
  const get=(p,o)=>p?Number(heap.read(p+o,'u64')):0;
  const set=(p,o,v)=>{if(!p)throw Error('RB tree null destination');heap.write(p+o,'u64',BigInt(v));};
  const left=p=>get(p,16),right=p=>get(p,24),parent=p=>get(p,8);
  const L=(p,v)=>set(p,16,v),R=(p,v)=>set(p,24,v),P=(p,v)=>set(p,8,v);
  const color=p=>p?heap.read(p,'i32'):1;
  const C=(p,c)=>{if(p)heap.write(p,'i32',c);};
  const minimum=p=>{while(left(p))p=left(p);return p;};
  const maximum=p=>{while(right(p))p=right(p);return p;};
  const rotateLeft=(x,header)=>{
    const y=right(x),z=left(y),p=parent(x);
    R(x,z);if(z)P(z,x);P(y,p);
    if(x===parent(header))P(header,y);
    else if(x===left(p))L(p,y);else R(p,y);
    L(y,x);P(x,y);
  };
  const rotateRight=(x,header)=>{
    const y=left(x),z=right(y),p=parent(x);
    L(x,z);if(z)P(z,x);P(y,p);
    if(x===parent(header))P(header,y);
    else if(x===right(p))R(p,y);else L(p,y);
    R(y,x);P(x,y);
  };
  function insert(insertLeft,x,p,header){
    x=Number(x);p=Number(p);header=Number(header);
    heap.check(x,32);heap.check(p,32);heap.check(header,32);
    if(x===header)throw Error('Cannot insert RB header as node');
    C(x,0);P(x,p);L(x,0);R(x,0);
    if(insertLeft){
      L(p,x);
      if(p===header){P(header,x);R(header,x);}
      else if(p===left(header))L(header,x);
    }else{
      R(p,x);if(p===right(header))R(header,x);
    }
    let root=parent(header);
    while(x!==root&&color(parent(x))===0){
      const px=parent(x),gp=parent(px);
      if(px===left(gp)){
        const uncle=right(gp);
        if(color(uncle)===0){C(px,1);C(uncle,1);C(gp,0);x=gp;}
        else{
          if(x===right(px)){x=px;rotateLeft(x,header);}
          C(parent(x),1);C(parent(parent(x)),0);rotateRight(parent(parent(x)),header);
        }
      }else{
        const uncle=left(gp);
        if(color(uncle)===0){C(px,1);C(uncle,1);C(gp,0);x=gp;}
        else{
          if(x===left(px)){x=px;rotateRight(x,header);}
          C(parent(x),1);C(parent(parent(x)),0);rotateLeft(parent(parent(x)),header);
        }
      }
      root=parent(header);
    }
    C(root,1);
  }
  function increment(x){
    x=Number(x);heap.check(x,32);
    if(right(x))return minimum(right(x));
    let y=parent(x);
    while(y&&x===right(y)){x=y;y=parent(y);}
    if(right(x)!==y)x=y;
    return x;
  }
  function decrement(x){
    x=Number(x);heap.check(x,32);
    // GNU libstdc++ header sentinel is red with grandparent == header.
    if(color(x)===0&&parent(x)&&parent(parent(x))===x)return right(x);
    if(left(x))return maximum(left(x));
    let y=parent(x);
    while(y&&x===left(y)){x=y;y=parent(y);}
    return y;
  }
  return Object.freeze({
    '_ZSt18_Rb_tree_incrementPSt18_Rb_tree_node_base':increment,
    '_ZSt18_Rb_tree_decrementPSt18_Rb_tree_node_base':decrement,
    '_ZSt29_Rb_tree_insert_and_rebalancebPSt18_Rb_tree_node_baseS0_RS_':insert,
  });
}
