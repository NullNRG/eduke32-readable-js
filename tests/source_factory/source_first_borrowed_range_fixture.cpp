#include <stdint.h>
#include "original-osdcvardata.h"
int setting[4];
osdcvardata_t entries[4] = {
 {"a","first",{(void*)&setting[0]},1,-1000,1000},
 {"b","second",{(void*)&setting[1]},2,-1000,1000},
 {"c","third",{(void*)&setting[2]},1,-1000,1000},
 {"d","fourth",{(void*)&setting[3]},2,-1000,1000}
};
osdcvardata_t* saved[4];
int remembered;
void add_setting(osdcvardata_t *p) { *p->i32 += 13; }
void sub_setting(osdcvardata_t *p) { *p->i32 -= 7; }
void remember_cvar(osdcvardata_t *p, void (*callback)(osdcvardata_t*)) {
 saved[remembered++] = p;
 callback(p);
}
extern "C" int borrowed_cvars(int seed) {
 remembered=0;
 for(int j=0;j<4;j++) setting[j]=seed+j;
 for(auto &entry:entries) remember_cvar(&entry, (entry.flags & 1) ? add_setting : sub_setting);
 int result=0;
 for(int j=0;j<4;j++) {
   saved[j]->flags += 2;
   *saved[j]->i32 += j;
   result += setting[j] * (j+1);
   result += (saved[j] == &entries[j]) * 100;
 }
 return result;
}
