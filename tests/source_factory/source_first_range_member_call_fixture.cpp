struct Row { int code, multiplier; };
Row source_rows[4] = {{3,2},{-7,4},{19,-3},{5,9}};
extern "C" int by_value(int x) { return x * 17 + 9; }
extern "C" int range_member_call_safe(int offset) {
  int sum = 0;
  for (auto &entry : source_rows) {
    sum += by_value(entry.code) + by_value(entry.multiplier) + offset;
  }
  return sum;
}
extern "C" void by_reference(int &value) { value += 100; }
extern "C" int range_member_call_unsafe_reference() {
  for (auto &entry : source_rows) by_reference(entry.code);
  return source_rows[0].code;
}
extern "C" int by_pointer(int *p) { return *p; }
extern "C" int range_member_call_unsafe_address() {
  int sum=0;
  for (auto &entry : source_rows) sum += by_pointer(&entry.code);
  return sum;
}
