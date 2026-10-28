from pathlib import Path
p=Path('tests/source_factory/verify_sourcefirst_byte_records.py');s=p.read_text().replace('reject_bitfield','bitfield_value')
s=s.replace('initialized(unsigned int);','initialized(unsigned int),bitfield_value(unsigned int);')
s=s.replace('printf("%u,%u,%u,%u,%u\\n",named(x),anonymous(x),packed(x),floatbits(x),initialized(x));','printf("%u,%u,%u,%u,%u,%u\\n",named(x),anonymous(x),packed(x),floatbits(x),initialized(x),bitfield_value(x));')
s=s.replace("'globals', 'empty'):","'globals', 'empty', 'bitfield_value'):")
s=s.replace("for name in ('reject_pointer', 'bitfield_value'):","for name in ('reject_pointer',):")
s=s.replace('s.initialized(x)].join', 's.initialized(x),s.bitfield_value(x)].join')
s=s.replace('PASS 5120 native', 'PASS 6144 native').replace('unsafe pointer/bitfield records blocked','mixed numeric/pointer unions blocked; bitfield masking verified')
p.write_text(s)
