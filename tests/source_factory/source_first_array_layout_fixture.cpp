using Cell = unsigned short;
using Matrix = Cell[3][7];
using Row = unsigned char[13];
extern "C" int matrixBytes() { return sizeof(Matrix); }
extern "C" int matrixAlign() { return alignof(Matrix); }
extern "C" int rowBytes() { return sizeof(Row); }
extern "C" int rowAlign() { return alignof(Row); }
extern "C" int localArrayBytes() { return sizeof(int[2][4]); }
extern "C" int sizeOfParameter(int x) { if (x > 3) [[likely]] return x + 8; return x - 2; }
