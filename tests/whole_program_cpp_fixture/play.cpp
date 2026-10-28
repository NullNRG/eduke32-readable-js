#include "ship.h"
extern "C" int run_ship(int initial,int speed,int dt) {
  Ship ship{initial,speed}; ship.step(dt); return ship.position;
}
