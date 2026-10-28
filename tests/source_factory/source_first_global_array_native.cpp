#include <cstdint>
#include <cstdio>
int lookupSum(int);
void updateGrid(int,int,uint32_t);
int main(){
 for(int i=0;i<1200;i++){
    int row=i%2,col=(i/2)%3;
    if(i%7==0)updateGrid(row,col,(uint32_t)(i*1234567u));
    std::printf("%d,%d,%d,%u\n",i,row,col,(unsigned)lookupSum(i%6));
 }
}
