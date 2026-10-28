extern int lookup(void);
extern int lookup_key(int);
int entry(int x) { return lookup() + lookup_key(x); }
