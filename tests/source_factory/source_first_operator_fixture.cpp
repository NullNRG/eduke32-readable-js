#include <cstdint>
enum class Signal : int { A=1, B=2, C=4 };
enum class Flags : int { A=8, B=16, C=32 };
Signal operator|(Signal a, Signal b) { return static_cast<Signal>(static_cast<int>(a) | static_cast<int>(b)); }
Flags operator|(Flags a, Flags b) { return static_cast<Flags>(static_cast<int>(a) | static_cast<int>(b)); }
Signal operator^(Signal a, Signal b) { return static_cast<Signal>(static_cast<int>(a) ^ static_cast<int>(b)); }
extern "C" int operator_mix(int x) {
    Signal a=static_cast<Signal>(x&7), b=Signal::B;
    Flags c=static_cast<Flags>(x&63), d=Flags::C;
    return static_cast<int>((a|b)^Signal::C) + static_cast<int>(c|d);
}
