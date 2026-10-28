#include <stdio.h>
int fmt_roundtrip(void){
  int a=printf("value=%04d\n",21);
  int b=fprintf(stderr,"hex=%#x signed=%lld\n",255,123456789123LL);
  char bytes[4]={'A',0,'B','C'};
  size_t n=fwrite(bytes,1,4,stdout);
  return a + b + (int)n;
}
