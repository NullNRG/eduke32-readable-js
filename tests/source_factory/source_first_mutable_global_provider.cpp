#include "source_first_mutable_global_fixture.h"
int scalar = 3;
float gain = 1.5f;
unsigned short narrow = 65000;
unsigned int serial = 4294967295u;
signed char small_signed = 0;
unsigned char small_unsigned = 0;
short signed_short = 0;
bool gate = false;
const int frozen = 37;
int effect_calls = 0;
int next = 0;
int samples[4] = {10,20,30,40};
int* cursor = samples;
int* scalarptr = &scalar;
const int* const_pointee = samples;
int* const fixed_pointer = samples;
int* owner_alias = &consumer_count;
int owner_read() { return scalar; }
int owner_bump_consumer(int amount) { consumer_count += amount; return consumer_count; }
int pointer_index() { return (int)(cursor - samples); }
int* owner_address() { return &scalar; }
int owner_compare_address(int* address) { return address == &scalar; }
int write_sink(int* address, int amount) { *address += amount; return *address; }
int* counted_address() { effect_calls++; return &scalar; }
unsigned char* counted_byte_address() { effect_calls++; return &small_unsigned; }
