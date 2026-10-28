#include "source_first_mutable_global_fixture.h"
int consumer_count = 4;
int* consumer_alias = &scalar;
int set_scalar(int value) { scalar = value; return scalar; }
int compound_scalar(int value) { scalar += value; return scalar; }
int post_scalar() { return scalar++; }
int pre_scalar() { return ++scalar; }
float set_gain(float value) { gain = value; return gain; }
float compound_gain(float value) { gain /= value; return gain; }
unsigned int post_serial() { return serial++; }
unsigned short set_narrow(int value) { narrow = value; return narrow; }
unsigned short compound_narrow(int value) { narrow += value; return narrow; }
int alias_shared(int value) { int* alias = &scalar; *alias = value; return owner_read(); }
int alias_owner(int value) { *scalarptr = value; return scalar; }
int retarget_cursor(int index) { cursor = samples + index; return *cursor; }
int step_cursor() { cursor += 1; return *cursor; }
int post_cursor() { int* previous = cursor++; return *previous; }
int pre_cursor() { return *(++cursor); }
int alias_cursor_slot() { int** slot = &cursor; *slot = samples + 2; return *cursor; }
int retarget_const_pointee() { const_pointee = samples + 1; return *const_pointee; }
int local_shadow() { int scalar = 91; scalar += 1; return scalar; }
int cycle_write() { return owner_bump_consumer(3); }
int compare_addresses() { return &scalar == &scalar && &scalar == owner_address() && scalarptr == &scalar && consumer_alias == &scalar; }
int validate_global_address() { return owner_compare_address(&scalar); }
int write_via_call(int amount) { return write_sink(&scalar,amount); }
int static_cycle_alias(int value) { *owner_alias = value; *consumer_alias = value + 1; return owner_read() + consumer_count; }
unsigned short narrow_alias(int value) { unsigned short* address = &narrow; *address = value; return narrow; }
float gain_alias(float value) { float* address = &gain; *address = value; return gain; }
int assign_schar_expression(int value) { return small_signed = value; }
int assign_uchar_expression(int value) { return small_unsigned = value; }
int assign_short_expression(int value) { return signed_short = value; }
int assign_ushort_expression(int value) { return narrow = value; }
int assign_bool_expression(int value) { return gate = value; }
double assign_gain_expression(double value) { return gain = value; }
int alias_byte_expression(int value) { unsigned char* address = &small_unsigned; return *address = value; }
int read_constants() { return frozen + *fixed_pointer; }
int mutate_array_element(int value) { samples[2] = value; return samples[2]; }
int compound_counted() { return *counted_address() += 3; }
int pre_counted_byte() { return ++*counted_byte_address(); }
int post_counted_byte() { return (*counted_byte_address())++; }
int local_next_alias() { int next = 7; int* address = &next; *address = 8; return ++next; }
int global_next_write(int value) { next = value; return next++; }
