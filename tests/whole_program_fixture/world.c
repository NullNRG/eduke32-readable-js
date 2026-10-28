extern int seed_position(int);
int game_tick(int frame) { return seed_position(frame) * 2 + 3; }
