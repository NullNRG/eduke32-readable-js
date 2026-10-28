from pathlib import Path
p=Path('work/package_current_continuation.py');s=p.read_text()
s=s.replace("'strict_game_test':'npm run test:browser-game'}", "'strict_game_test':'npm run test:browser-game','local_postbuild_worker':read('reports/oct15-heap-pointer-queued-link.json'),'local_process_ids_are_host_specific':True}")
s=s.replace('The final game test must remain failing until original gameplay actually works.', 'On the original host, reports/oct15-heap-pointer-queued-link.json records the\nauthorized worker waiting for the active rebuild, then running the saved linker,\noriginal boot audit and strict game gate. It cannot implement new C++ semantics.\nIts process IDs are host-specific and are not valid on a receiving machine.\n\nThe final game test must remain failing until original gameplay actually works.')
p.write_text(s)
p=Path('work/update_current_status.py');s=p.read_text();s=s.replace('writer if the newest rebuild is still running. Its persistent checkpoints are', 'writer if the newest rebuild is still running. The authorized local worker in\nreports/oct15-heap-pointer-queued-link.json waits for this rebuild, then runs\nlinking, original boot auditing and the strict game gate. That worker does not\nautomatically implement additional missing C++ semantics. Process IDs are host\nspecific. Its persistent checkpoints are')
p.write_text(s)
