"""Clang field-offset parser including exact bit ranges and unnamed padding."""
import re

def direct_fields(block):
 fields=[]
 for match in re.finditer(r'^\s*(\d+)(?::(\d+)-(\d+)|:(-))?\s*\|   (\S[^\n]*)$',block,re.M):
  byte,start,end,zero,declaration=match.groups()
  field={'offset':int(byte),'declaration':declaration.strip()}
  if start is not None:field.update(bit_start=int(start),bit_width=int(end)-int(start)+1)
  elif zero is not None:field.update(bit_start=0,bit_width=0)
  fields.append(field)
 return fields
