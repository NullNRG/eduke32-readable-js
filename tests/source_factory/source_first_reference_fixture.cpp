int increaseThroughPtr(int *ptr) {
    int old = *ptr;
    *ptr = old + 3;
    return old;
}
int updateLocal(int value) {
    increaseThroughPtr(&value);
    return value;
}
int changeArray(int array[4], int index) {
    int *ptr = &array[index];
    *ptr += 9;
    return array[index];
}
