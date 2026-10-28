// Clang must supply values of enum constants excluded by a filtered AST.
enum Flags { FLAGS_ONE = 0x2, FLAGS_TWO = 0x8, FLAGS_THREE = 0x20 };
extern "C" int enum_consumed(int value)
{
    return (value & FLAGS_ONE) ? (FLAGS_TWO + FLAGS_THREE + value) : (value - FLAGS_ONE);
}
namespace Alpha { enum E { DUPLICATE_VALUE = 5 }; }
namespace Beta  { enum E { DUPLICATE_VALUE = 9 }; }
extern "C" int enum_ambig(int value) { return value + Alpha::DUPLICATE_VALUE; }
