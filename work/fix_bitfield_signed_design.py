from pathlib import Path
p=Path('work/verify_bitfield_native_design.py');s=p.read_text().replace("signed:/signed|^int /.test(field.declaration)&&!/^unsigned/.test(field.declaration)","signed:!/^unsigned|^_Bool|^bool/.test(field.declaration)").replace("boolean:/^bool/.test(field.declaration)","boolean:/^(?:bool|_Bool)/.test(field.declaration)");p.write_text(s)
