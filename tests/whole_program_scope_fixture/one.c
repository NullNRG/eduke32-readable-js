static int counter=5;
int read_one(void) { return counter; }
void set_one(int n) {counter=n;}
extern int read_two(void);
int both(void) {return read_one()+read_two();}
