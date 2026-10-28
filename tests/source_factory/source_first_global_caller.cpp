extern "C" int kernelStep(int n);
extern "C" int kernelRun(int n) { return kernelStep(n) + 13; }
