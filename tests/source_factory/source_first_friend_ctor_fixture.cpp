class Counter {
 public:
 int value;
 Counter():Counter(0){}
 Counter(int x):value(x){}
 Counter(int a,int b):Counter(a+b){}
 Counter(const Counter&)=default;
 Counter& operator-=(const Counter& rhs){value-=rhs.value;return *this;}
 friend Counter operator-(Counter lhs,const Counter& rhs){return lhs-=rhs;}
 friend bool operator<(const Counter& lhs,const Counter& rhs){return lhs.value<rhs.value;}
};
extern "C" int run(int a,int b){Counter x(a,b),y(2);Counter z=x-y; return z.value+(x<y)+(Counter().value);}
