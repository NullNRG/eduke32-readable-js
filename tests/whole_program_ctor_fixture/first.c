extern void change_state(int);
__attribute__((constructor(101))) static void initialize_first(void) { change_state(4); }
