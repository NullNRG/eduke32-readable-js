#include <cstdint>
enum State { STATE_EMPTY = 0, STATE_START = 7, STATE_PENDING, STATE_COMPLETE=31, STATE_FAILURE };
enum Error { ERR_OK = -3, ERR_RETRY, ERR_DONE=12, ERR_STOP };
extern "C" int classify(int value) {
  if (value == STATE_PENDING) return STATE_COMPLETE;
  if (value == ERR_RETRY) return ERR_STOP;
  return value + STATE_FAILURE - ERR_OK;
}
extern "C" int compute(int value) {
  int result=ERR_DONE;
  for (int i=0;i<4;i++) result += STATE_START + i;
  return result + value;
}
