#include "compat.h"
#include "vec.h"
#include "menus.h"
extern "C" int oracle_yline(int i) {
    MenuFont_t font = {};
    font.emptychar.y = 15 << 16;
    font.zoom = i * 257;
    font.ypadding = (i % 9) * 1024;
    return font.get_yline();
}
extern "C" int oracle_yoffset(int i) {
    MenuFont_t font = {};
    font.zoom = i * 257;
    font.ypadding = (i % 9) * 1024;
    return font.get_yoffset();
}
extern "C" int oracle_margin(int i) {
    MenuEntryFormat_t entry = {};
    MenuFont_t font = {};
    MenuOptionSet_t options = {}, copiedOptions = {};
    entry.marginBottom = (i % 17) * 4096;
    font.zoom = i * 257;
    options.entryFormat = &entry;
    options.font = &font;
    copiedOptions = options;
    options.entryFormat = nullptr;
    options.font = nullptr;
    return copiedOptions.getMarginBottom();
}
extern "C" int oracle_indent(int i) {
    MenuEntryFormat_t entry = {};
    MenuFont_t font = {};
    MenuOptionSet_t options = {}, copiedOptions = {};
    entry.indent = -(i % 11) * 2048;
    font.zoom = i * 257;
    options.entryFormat = &entry;
    options.font = &font;
    copiedOptions = options;
    options.entryFormat = nullptr;
    options.font = nullptr;
    return copiedOptions.getIndent();
}
