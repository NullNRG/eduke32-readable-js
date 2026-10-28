// Original Build declarations and vector method bodies are included unchanged.
#include "vec.h"
#include <cstring>
#define Tracker(container, type) type
#pragma pack(push,1)
#include "buildtypes.h"
typedef tspritetype *tspriteptr_t;
#include "original-spriteext.h"
#pragma pack(pop)

walltypev7 original_walls[8];
spritetypev7 original_sprites[8];
tspritetype original_draw_sprites[8];
spriteext_t original_sprite_extensions[8];
spriteext_t original_sprite_extensions_copy[8];

extern "C" int original_world_sizes()
{
    return sizeof(walltypev7)*10000 + sizeof(spritetypev7)*100 + sizeof(tspritetype);
}

extern "C" int original_world_mutate(int i)
{
    int index=i%8;
    auto &wall=original_walls[index];
    auto &sprite=original_sprites[index];
    wall.x=i*97-17000;
    wall.y=i*31;
    wall.shade=(int8_t)(i-200);
    wall.xy+=vec2_t{11,-7};
    sprite.x=i*101;
    sprite.y=i*13;
    sprite.z=i*19;
    sprite.xyz+=vec3_t{3,5,7};
    sprite.vel+=vec3_16_t{(int16_t)i,(int16_t)(i+2),(int16_t)(i+3)};
    sprite.extra=(int16_t)(i*991);
    return wall.x+wall.xy.y+wall.shade+sprite.xyz.d+sprite.y+sprite.z
         +sprite.xvel+sprite.yvel+sprite.vel.v+sprite.extra;
}

extern "C" int original_world_copy(int i)
{
    // A record array has one allocation, not eight independent byte buffers.
    memcpy(original_draw_sprites,original_sprites,sizeof(original_sprites));
    int index=i%8;
    tspritetype snapshot=original_draw_sprites[index];
    snapshot.xyz+=vec3_t{5,-9,13};
    original_draw_sprites[index].vel+=vec3_16_t{3,7,11};
    return snapshot.x+snapshot.xy.y+snapshot.z+snapshot.xvel
         +original_draw_sprites[index].x+original_draw_sprites[index].vel.v;
}

extern "C" int original_world_clear()
{
    memset(original_walls,0,sizeof(original_walls));
    memset(original_sprites,0,sizeof(original_sprites));
    memset(original_draw_sprites,0,sizeof(original_draw_sprites));
    original_sprites[0].xyz+=vec3_t{17,19,23};
    return original_sprites[0].x+original_sprites[0].y+original_sprites[0].z
         +original_sprites[7].x+original_walls[7].shade+original_draw_sprites[7].z;
}

extern "C" int original_pointer_storage(int i)
{
    int index=i%8,next=(index+1)%8;
    auto &ext=original_sprite_extensions[index];
    ext.tspr=&original_draw_sprites[next];
    ext.tspr->x=i*23;
    ext.mdpivot_offset.x=i*11;
    ext.mdposition_offset.y=i*13;
    ext.alpha=(float)i*0.5f;
    ext.filler[3]=(uint8_t)i;
    memcpy(original_sprite_extensions_copy,original_sprite_extensions,sizeof(original_sprite_extensions));
    auto &copy=original_sprite_extensions_copy[index];
    copy.tspr->y=i*29;
    int equal=copy.tspr==&original_draw_sprites[next];
    int sum=equal+copy.tspr->x+ext.tspr->y+copy.mdpivot_offset.x+copy.mdposition_offset.y
           +(int)copy.alpha+copy.filler[3]+sizeof(spriteext_t);
    memset(original_sprite_extensions_copy,0,sizeof(original_sprite_extensions_copy));
    return sum+(original_sprite_extensions_copy[index].tspr==nullptr);
}
