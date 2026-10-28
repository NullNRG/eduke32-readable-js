#include <cstdint>
static const int16_t history[6]={-3,1,4,1,5,9};
static uint32_t grid[2][3]={{1,2,3},{4,5,6}};
int lookupSum(int key){return history[key%6]+grid[key%2][key%3];}
void updateGrid(int row,int col,uint32_t value){grid[row][col]=value;}
