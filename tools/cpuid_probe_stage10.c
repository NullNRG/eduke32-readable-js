#include <cpuid.h>
#include <stdio.h>
int main(void){unsigned leaves[]={0,1,7,0x80000000u,0x80000001u,0x80000002u,0x80000003u,0x80000004u,0x80000007u,0x80000008u};
puts("{");for(unsigned i=0;i<sizeof(leaves)/sizeof(leaves[0]);i++){unsigned a=0,b=0,c=0,d=0;__get_cpuid_count(leaves[i],0,&a,&b,&c,&d);printf("\"%u\":[%u,%u,%u,%u]%s\n",leaves[i],a,b,c,d,i+1<sizeof(leaves)/sizeof(leaves[0])?",":"");}puts("}");}
