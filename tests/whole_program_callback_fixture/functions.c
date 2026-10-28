int double_it(int x) { return x * 2; }
int triple_it(int x) { return x * 3; }
int (*callbacks[2])(int) = { double_it, triple_it };
int dispatch(int index, int value) { return callbacks[index & 1](value); }
