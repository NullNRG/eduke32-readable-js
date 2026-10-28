#include <stdint.h>
#include <string.h>
extern const char message_data[];
int startup_choice(int condition) {
    const char *ptr = condition ? message_data+2 : message_data+5;
    return (int)*ptr;
}
float bit_as_float(int32_t bits) {
    float output; memcpy(&output,&bits,4);return output;
}
int32_t float_as_bit(float number) {
    int32_t bits;memcpy(&bits,&number,4);return bits;
}
int startup_total(int condition) {
    return startup_choice(condition) + (float_as_bit(bit_as_float(0x3f800000))==0x3f800000 ? 17 : 0);
}
