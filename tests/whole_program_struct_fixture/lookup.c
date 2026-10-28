struct Entry { int number; const char *text; double weight; };
extern const struct Entry entries[2];
extern const char rows[2][5];
int entry_value(int i) {return entries[i].number + (unsigned char)entries[i].text[0] + (int)entries[i].weight;}
int row_value(int i) {return (unsigned char)rows[i][1];}
