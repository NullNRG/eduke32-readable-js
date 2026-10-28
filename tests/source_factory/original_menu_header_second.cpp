#include "compat.h"
#include "vec.h"
#include "menus.h"
extern "C" int second_yline(int i) {
    MenuFont_t font = {};
    font.emptychar.y = 15 << 16;
    font.zoom = i * 257;
    font.ypadding = (i % 9) * 1024;
    return font.get_yline();
}
