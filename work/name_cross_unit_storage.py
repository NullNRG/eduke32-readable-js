from pathlib import Path
p=Path('tests/source_factory/verify_sourcefirst_contiguous_records.py');s=p.read_text().replace('int cross_unit_bytes(int n){union{unsigned long long align;','int cross_unit_bytes(int n){union ReaderBytes{unsigned long long align;');p.write_text(s)
