enum SourceMode { SOURCE_START=23, SOURCE_MIDDLE, SOURCE_END };
extern "C" int enum_span_tail(int seed) { return seed + SOURCE_END; }
