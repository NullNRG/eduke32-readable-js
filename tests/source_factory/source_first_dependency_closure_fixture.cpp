extern "C" int closureLeaf(int n) { return n*7-4; }
extern "C" int closureHelper(int n) { return closureLeaf(n+1)-3; }
extern "C" int closureEntry(int n) { return closureHelper(n*2)+closureLeaf(n); }
