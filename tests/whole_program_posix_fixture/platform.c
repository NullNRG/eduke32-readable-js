#include <stdlib.h>
#include <stdint.h>
#include <pthread.h>
#include <time.h>
static int compare_numbers(const void *a,const void *b) {
    int32_t x=*(const int32_t*)a, y=*(const int32_t*)b;
    return (x>y) - (x<y);
}
int sort_and_checksum(void){
    int32_t values[8]={9,1,6,-4,4,8,-12,0};
    qsort(values,8,sizeof(int32_t),compare_numbers);
    int checksum=0;
    for(int i=0;i<8;i++) checksum += (i+1)*values[i];
    return checksum;
}
static pthread_mutex_t mutex=PTHREAD_MUTEX_INITIALIZER;
int mutex_roundtrip(void){
    if(pthread_mutex_lock(&mutex))return -1;
    int busy=pthread_mutex_trylock(&mutex);
    int unlock=pthread_mutex_unlock(&mutex);
    int again=pthread_mutex_lock(&mutex);
    int finish=pthread_mutex_unlock(&mutex);
    return busy == 16 && !unlock && !again && !finish;
}
int clock_roundtrip(void){
    struct timespec ts;
    if(clock_gettime(CLOCK_MONOTONIC,&ts))return -1;
    return ts.tv_sec>=0 && ts.tv_nsec>=0 && ts.tv_nsec<1000000000;
}
