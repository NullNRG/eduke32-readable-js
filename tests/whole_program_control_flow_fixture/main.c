extern int alpha(int);
extern int beta(int);
extern int gamma(int);
extern int delta(int);
extern int epsilon(int);
extern int zeta(int);
static const char codebook[] = "ABCDEFG";
int dispatch(int op, int value) {
    switch(op) {
      case -9: return alpha(value);
      case 3: return beta(value);
      case 11: return gamma(value);
      case 27: return delta(value);
      case 100: return epsilon(value);
      case 987: return zeta(value);
      default: return -(value + (int)codebook[2]);
    }
}
int call_with_global_offset(int value) { return (int)codebook[value & 3]; }
