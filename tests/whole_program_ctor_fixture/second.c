extern void change_state(int);
__attribute__((constructor(201))) static void initialize_second(void) { change_state(7); }
