static char const* filenames[4] = { "DUKE3D.GRP", "NAM.GRP", "NAPALM.GRP", "WW2GI.GRP" };
static char const* tags[5] = { "A", "B", "C" };
extern "C" const char * select_filename(int i) { return filenames[i % 4]; }
extern "C" const char * select_tag(int i) { return tags[i % 5]; }
static char const* currentTitle = "Duke 3D";
extern "C" const char * title_name() { return currentTitle; }
