// Write-through C++ range-for aliases must update the original array element.
extern "C" int range_write(int seed) {
    int values[7] = {2, 9, -3, 0, 6, -8, 14};
    int sum = 0;
    for (int &item : values) {
        item += seed % 13;
        ++item;
        sum += item;
    }
    for (int &item : values) {
        item = item * 2 - (seed % 5);
        sum += item;
    }
    return sum + values[0] + values[6];
}

void range_write_unknown(int &x) { x += 10; }
extern "C" int range_write_unsafe(int seed) {
    int values[2] = {seed, 3};
    for (int &item : values) range_write_unknown(item);
    return values[0];
}
