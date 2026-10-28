// C++ enum initializer references another enum; subsequent implicit values
// must use the referenced value, not restart enumeration at zero.
enum FirstEnum { FIRST_A = 6, FIRST_B, FIRST_C };
enum SecondEnum { SECOND_A = FIRST_C, SECOND_B, SECOND_C };
extern "C" int enum_alias_chain(int input) {
    return (input & 1 ? SECOND_C : SECOND_B) + (input & 2 ? FIRST_B : FIRST_A);
}
