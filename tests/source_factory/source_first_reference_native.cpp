#include <cstdio>
int increaseThroughPtr(int*);
int updateLocal(int);
int changeArray(int*,int);
int main(){for(int i=-1000;i<=1000;i++){
 int arr[4]={i,i+1,i+2,i+3};
 int copy=i;
 int old=increaseThroughPtr(&copy);
 int updated=updateLocal(i);
 int changed=changeArray(arr,(i+1000)%4);
 std::printf("%d,%d,%d,%d,%d\n",i,old,copy,updated,changed);
}}
