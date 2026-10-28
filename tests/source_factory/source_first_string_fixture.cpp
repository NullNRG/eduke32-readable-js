extern "C" {
unsigned char payload[8] = "\x01\x7f\x80\000";
char visible[12] = "duke";
int test_string_bytes() { return payload[0] + payload[1] + payload[2] + payload[3] + visible[0] + visible[4]; }
}
extern "C" int sum_pair_loop(int n) {
    int total = 0;
    for (int i=0, j=n-1; i<j; ++i, --j) total += i+j;
    return total;
}
