#!/usr/bin/env python3
"""Fetch Clang 18 builtin headers with Debian package-index checksum evidence.

Only headers/data are unpacked; no downloaded native code is executed. A saved
manifest can replay the exact package independently of future Debian updates.
"""
import argparse
import hashlib
import json
import lzma
from pathlib import Path
from bootstrap_linux_sysroot import download, unpack, MIRROR

INDEX = MIRROR + 'dists/trixie/main/binary-amd64/Packages.xz'
PACKAGE = 'libclang-common-18-dev'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--manifest', type=Path)
    args = parser.parse_args()
    root = args.out.resolve()
    root.mkdir(parents=True, exist_ok=True)
    if args.manifest:
        report = json.loads(args.manifest.read_text(encoding='utf-8'))
    else:
        index = download(INDEX)
        selected = None
        for block in lzma.decompress(index).decode().split('\n\n'):
            fields = dict(line.split(': ', 1) for line in block.splitlines()
                          if ': ' in line and not line.startswith(' '))
            if fields.get('Package') == PACKAGE:
                selected = fields
                break
        if selected is None:
            raise RuntimeError(PACKAGE + ' absent from Debian index; replay a saved manifest')
        report = {'format': 'source-first-libclang-resources/1',
                  'package_index': INDEX, 'index_sha256': hashlib.sha256(index).hexdigest(),
                  'package': PACKAGE, 'version': selected['Version'],
                  'url': MIRROR + selected['Filename'], 'sha256': selected['SHA256'],
                  'resource_version': selected['Version'].split(':')[-1].split('-')[0],
                  'resource_relative_path': 'usr/lib/llvm-18/lib/clang/18',
                  'downloaded_binaries_executed': False}
    data = download(report['url'])
    if hashlib.sha256(data).hexdigest() != report['sha256']:
        raise RuntimeError('Clang resource package SHA256 mismatch')
    links = unpack(data, root)
    for _ in range(len(links) + 1):
        remaining = []
        for target, origin in links:
            if origin.is_file():
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(origin.read_bytes())
            else:
                remaining.append((target, origin))
        if len(remaining) == len(links):
            break
        links = remaining
    resource = root / report['resource_relative_path']
    if not (resource/'include/stddef.h').is_file():
        raise RuntimeError('Expected Clang resource headers missing from verified package')
    report['unmaterialized_links'] = [str(target.relative_to(root)) for target, _ in links]
    (resource/'resource-manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    (root/'resource-package-manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'resource_dir':str(resource), **report}, indent=2), flush=True)


if __name__ == '__main__':
    main()
