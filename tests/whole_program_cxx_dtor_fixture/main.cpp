static int state=0;
struct Resource {
  explicit Resource(int n):number(n){state+=number;}
  ~Resource(){state+=number*10;}
  int number;
};
static Resource r1(3);
static Resource r2(7);
extern "C" int get_lifetime_state(){return state;}
