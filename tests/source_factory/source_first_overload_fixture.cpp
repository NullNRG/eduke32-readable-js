extern "C" int unaffected(int n){return n*3+2;}
int overloaded(int n){return n+4;}
double overloaded(double n){return n+0.5;}
extern "C" int resolveOverloads(int x) { return overloaded(x) * 3 + (int)overloaded((double)x); }
