struct Lookup { int code; int value; };
Lookup lookup[5]={{4,30},{7,40},{7,50},{12,60},{-2,90}};
extern "C" int range_find(int key) {
    for (auto const &entry : lookup)
        if (entry.code == key)
            return entry.value;
    return -1;
}
extern "C" int range_sum() {
    int total=0;
    for (auto &entry : lookup)
        total+=entry.code;
    return total;
}
