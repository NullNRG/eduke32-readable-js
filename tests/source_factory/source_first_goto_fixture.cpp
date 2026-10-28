extern "C" int forward(int x) {
    int value = x + 2;
    if (x < 0) goto out;
    value *= 3;
out:
    return value;
}
extern "C" int nested(int x, int y) {
    int n = 0;
    if (x < 0) goto done;
    for (int i=0; i<4; i++) {
        if (i == x) goto tail;
        n += i;
    }
tail:
    if (y) goto done;
    n += 90;
done:
    return n;
}
extern "C" int backward(int x) {
    int n = 0;
loop:
    if (x <= 0) goto done;
    n += x;
    --x;
    goto loop;
done:
    return n;
}
extern "C" int mixed(int n) {
    int total = 0;
    if (n < 0) goto cycle;
    total = n;
cycle:
    total++;
    if (total < 4) goto cycle;
    return total;
}
extern "C" int switch_exit(int n) {
    int value = 4;
    switch (n) {
        case 0: value += 1; goto done;
        case 1: value += 3; break;
        default: value += 8; break;
    }
    value *= 5;
done:
    return value;
}
extern "C" int cleanup(int n) {
    int status = 1;
    do {
        if (n < 0) goto error;
        status = n * 5;
        if (n > 30) goto error;
    } while (0);
    return status;
error:
    return -7;
}
extern "C" int two_loops(int n, int m) {
    int v=0;
again:
    if (n > 0) { v += n; --n; goto again; }
again2:
    if (m > 0) { v += 2*m; --m; goto again2; }
    return v;
}

extern "C" int nested_error_return(int n) {
    int checksum=n*3;
    if(n<0) goto error;
    if(n>30) {
error:
        checksum+=17;
        checksum*=2;
        return checksum-3;
    }
    for(int i=0;i<5;i++) {
        checksum+=i;
        if(i==n) goto error;
    }
    return checksum;
}
