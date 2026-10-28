#pragma once
struct Accumulator {
    int value;
    explicit Accumulator(int x) : value(x) {}
    Accumulator& operator+=(Accumulator const& rhs) { value += rhs.value; return *this; }
    int result() const { return value; }
};
