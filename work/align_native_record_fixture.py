import re
from pathlib import Path
p=Path('tests/source_factory/verify_sourcefirst_contiguous_records.py');s=p.read_text()
s=s.replace('extern "C" void*memcpy(void*,const void*,__SIZE_TYPE__);','extern "C" void*memcpy(void*,const void*,__SIZE_TYPE__);\n extern "C" void*memset(void*,int,__SIZE_TYPE__);')
s=re.sub(r'alignas\((Cell|Link)\) unsigned char bytes\[(.+?)\]=\{\};',r'union {unsigned long long alignment;unsigned char data[\2];} storage={};unsigned char *bytes=storage.data;memset(bytes,0,sizeof(storage.data));',s)
p.write_text(s)
