extern "C" int add_default(int x,int delta=11){return x+delta;}
extern "C" int test_default(int x){return add_default(x)+add_default(x,7);}
