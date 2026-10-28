extern "C" int switch_scope(int which, int number) {
    switch(which) {
        case 0: { int local = number + 1; return local; }
        case 1: { int local = number - 2; return local; }
        case 2:
        case 3: { int local = number * 2; return local; }
        default: return -17;
    }
}
extern "C" int block_scope(int which) {
    int local = which + 3;
    { int local = which * 2; if(local > 20) return local; }
    { int local = which - 7; if(local < -10) return local; }
    return local;
}
