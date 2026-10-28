/* GNU labels-as-values require real LLVM blockaddress and indirectbr support. */
int dispatch(int index,int value) {
    static const void *const labels[] = {&&A,&&B,&&C,&&D};
    if (index < 0 || index >= 4) return -99;
    goto *labels[index];
A: return value + 3;
B: return value * 4;
C: return value - 5;
D: return (value ^ 13) + 1;
}
