#include <stdarg.h>
#include <stdint.h>
// The whole-source Clang backend must lower *actual* SysV va_arg IR.
int sum_ints(int count, ...) {
    va_list ap; va_start(ap,count);
    int result=0;
    for(int i=0;i<count;i++)result+=va_arg(ap,int);
    va_end(ap);return result;
}
long long sum_wide(int count, ...) {
    va_list ap;va_start(ap,count);
    long long total=0;
    for(int i=0;i<count;i++)total+=va_arg(ap,long long);
    va_end(ap);return total;
}
double sum_doubles(int count, ...){
    va_list ap;va_start(ap,count);
    double total=0;
    for(int i=0;i<count;i++)total+=va_arg(ap,double);
    va_end(ap);return total;
}
long long mix_types(int first, double second, ...) {
    va_list ap;va_start(ap,second);
    long long x=va_arg(ap,long long);
    double y=va_arg(ap,double);
    long long z=va_arg(ap,long long);
    va_end(ap);
    return first+x+z+(long long)(10*(second+y));
}
int test_copy(int start, ...) {
    va_list a,b;va_start(a,start);va_copy(b,a);
    int x=va_arg(a,int),y=va_arg(b,int);
    va_end(a);va_end(b);
    return start+x+y;
}
int call_sum(void){return sum_ints(9,1,2,3,4,5,6,7,8,9);}
long long call_wide(void){return sum_wide(8,10000000000LL,20000000000LL,30000000000LL,40000000000LL,50000000000LL,60000000000LL,70000000000LL,80000000000LL);}
double call_double(void){return sum_doubles(10,1.,2.,3.,4.,5.,6.,7.,8.,9.,10.);}
long long call_mix(void){return mix_types(3,1.5,10000000000LL,2.5,40LL);}
int call_copy(void){return test_copy(4,7);}
#include <stdio.h>
static int format_checksum(const char *buffer,int n){
    unsigned int hash=0;
    for(int i=0;buffer[i];i++) hash=(hash*33u+(unsigned char)buffer[i])%65521u;
    return (int)hash+n;
}
int format_direct(void){
    char buffer[128];
    int n=snprintf(buffer,sizeof(buffer),"%+08d:%04x:%-7.3s:%lld:%8.2f:%%",7,255,"HELLO",123456789123LL,2.5);
    return format_checksum(buffer,n);
}
int format_forward(int tag, ...){
    char buffer[128];
    va_list ap;va_start(ap,tag);
    int n=vsnprintf(buffer,sizeof(buffer),"%+08d:%04x:%-7.3s:%lld:%8.2f:%%",ap);
    va_end(ap);
    return tag+format_checksum(buffer,n);
}
int call_forward(void){return format_forward(13,7,255,"HELLO",123456789123LL,2.5);}
int format_truncate(void){
    char buffer[8];
    int n=snprintf(buffer,sizeof(buffer),"%u-%s",4294967295u,"abcdef");
    return format_checksum(buffer,n);
}
