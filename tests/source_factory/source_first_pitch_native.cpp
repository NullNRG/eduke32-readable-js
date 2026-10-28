#include "pitch.h"
#include <cstdint>
#include <cstdio>
int main(){
 for(int n=-2000;n<=2000;n+=3){printf("%d,%u\n",n,PITCH_GetScale(n));}
}
