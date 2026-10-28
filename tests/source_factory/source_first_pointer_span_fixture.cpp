// Independent C++ fixture. No EDuke32-specific type names or runtime helpers.
struct NumberSpan {
    int *data_;
    unsigned long length_;
    int *begin() const { return data_; }
    int *end() const { return data_ + length_; }
};
struct PointerSpan {
    int **data_;
    unsigned long length_;
    int **begin() const { return data_; }
    int **end() const { return data_ + length_; }
};
struct InvalidSpan {
    int *data_;
    unsigned long length_;
    int *begin() const { return data_ + 1; }
    int *end() const { return data_ + length_; }
};
extern "C" int span_numbers(const NumberSpan &items, int seed) {
    int result = seed;
    for (const int &number : items) result += number;
    return result;
}
extern "C" int span_pointers(const PointerSpan &items, int seed) {
    int result = seed;
    for (int *pointer : items) result += *pointer;
    return result;
}
extern "C" int span_invalid(const InvalidSpan &items, int seed) {
    int result = seed;
    for (int value : items) result += value;
    return result;
}
