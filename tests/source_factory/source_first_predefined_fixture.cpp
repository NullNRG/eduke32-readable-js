// Test the original Clang-resolved special function identifiers.
extern "C" int boot_name(int input)
{
    const char *name = __func__;
    const char *function = __FUNCTION__;
    const char *signature = __PRETTY_FUNCTION__;
    if (name == nullptr || function == nullptr || signature == nullptr)
        return -1;
    return int(sizeof(__func__) + sizeof(__FUNCTION__) + sizeof(__PRETTY_FUNCTION__))
        + name[0] + name[8] + function[0] + function[8] + signature[0] + signature[17] + input % 11;
}
