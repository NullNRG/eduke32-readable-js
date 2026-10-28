int shared_value = 12;
int *linked_value = &shared_value;
int lookup(void) { return *linked_value; }
const int keymap[4] = {0,5,8,13};
int lookup_key(int n) { return keymap[n & 3]; }
