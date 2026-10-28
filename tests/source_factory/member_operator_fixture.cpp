#include "member_operator_fixture.hpp"
extern "C" int original_add(int x, int y) {
    Accumulator left(x);
    Accumulator right(y);
    left += right;
    return left.result();
}
