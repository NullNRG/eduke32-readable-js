struct Cell { int x; int y; };
extern "C" int cell_walk(Cell *items, int count) {
    int total=0;
    for (int i=0; i<count; ++i, ++items)
        total += items->x + 3*items->y;
    return total;
}
extern "C" int cell_skip(Cell *items, int count) {
    if (count<=1) return 0;
    Cell *end=items+count;
    Cell *next=items+1;
    int result=0;
    for (;next<end;++next) result+=next->x;
    return result;
}
using CellAlias = Cell;
using CellPtr = CellAlias const *;
extern "C" int cell_alias_sum(CellPtr items,int count) {
    int total = 0;
    for(int i=0;i<count;++i,++items) total += items->x - items->y;
    return total;
}
