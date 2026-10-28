// Source-owned C++ objects: registration happens only after construction.
// Each lexical scope and each full expression disposes in reverse order.
const cLifetime = {
  own(scope, value, destroy) {
    if (!value || typeof value[destroy] !== 'function')
      throw new TypeError('Original C++ destructor provider is unavailable');
    scope.push({value,destroy});
    return value;
  },
  close(scope, transferred) {
    for (let i=scope.length-1;i>=0;i--) {
      const entry=scope[i];
      if (entry.value!==transferred) entry.value[entry.destroy]();
    }
  },
  expression(run, transferResult) {
    const scope=[];
    let result,complete=false;
    try { result=run(scope); complete=true; return result; }
    finally { this.close(scope, complete && transferResult ? result : undefined); }
  }
};
