#!/usr/bin/env python3
"""Materialize Debian bookworm development headers for Linux AST extraction.

This installs no packages and executes no downloaded binaries. Package bytes
are verified against the HTTPS Debian package index; the manifest preserves
exact URLs and SHA256s. Native Windows oracle tests use a separate toolchain.
"""
import argparse
import hashlib
import io
import json
import lzma
from pathlib import Path, PurePosixPath
import tarfile
import urllib.request

MIRROR = 'https://deb.debian.org/debian/'
INDEX = MIRROR + 'dists/bookworm/main/binary-amd64/Packages.xz'
PACKAGES = ('libc6-dev', 'linux-libc-dev', 'libstdc++-12-dev', 'libgcc-12-dev',
            'libcrypt-dev', 'libbsd-dev', 'libmd-dev', 'libsdl2-dev',
            'libflac-dev', 'libogg-dev', 'libvorbis-dev', 'zlib1g-dev', 'liblz4-dev')

def download(url):
    with urllib.request.urlopen(url, timeout=120) as stream:
        return stream.read()

def ar_members(data):
    if data[:8] != b'!<arch>\n':
        raise ValueError('invalid Debian ar archive')
    offset = 8
    while offset < len(data):
        header = data[offset:offset+60]
        if len(header) != 60 or header[58:] != b'`\n':
            raise ValueError('invalid ar header')
        size = int(header[48:58].strip())
        name = header[:16].decode('ascii').strip().rstrip('/')
        offset += 60
        yield name, data[offset:offset+size]
        offset += size + size % 2

def unpack(data, root):
    pending = []
    payload = next(value for name, value in ar_members(data) if name.startswith('data.tar'))
    with tarfile.open(fileobj=io.BytesIO(payload), mode='r:*') as archive:
        for member in archive:
            rel = PurePosixPath(member.name)
            if rel.is_absolute() or '..' in rel.parts:
                raise ValueError('unsafe package member: ' + member.name)
            target = root.joinpath(*rel.parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            elif member.isfile():
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(archive.extractfile(member).read())
            elif member.issym() or member.islnk():
                # Materialize links without requiring Windows symlink privileges.
                link = PurePosixPath(member.linkname)
                origin = root.joinpath(*link.parts[1:]) if link.is_absolute() else (target.parent / member.linkname if member.issym() else root / member.linkname)
                origin = origin.resolve()
                if not origin.is_relative_to(root):
                    raise ValueError('package link escapes sysroot')
                pending.append((target, origin))
    return pending

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, help='replay exact package URLs and SHA256s from a saved sysroot manifest')
    args = parser.parse_args()
    root = args.out.resolve()
    root.mkdir(parents=True, exist_ok=True)
    if args.manifest:
        locked=json.loads(args.manifest.read_text(encoding='utf-8'))
        records={p['package']:{'Version':p['version'],'URL':p['url'],'SHA256':p['sha256']}
                 for p in locked['packages']}
        index_sha=locked['index_sha256']
    else:
        index_bytes = download(INDEX)
        index_sha=hashlib.sha256(index_bytes).hexdigest()
        records = {}
        for block in lzma.decompress(index_bytes).decode().split('\n\n'):
            fields = dict(line.split(': ', 1) for line in block.splitlines() if ': ' in line and not line.startswith(' '))
            if fields.get('Package') in PACKAGES:
                records[fields['Package']] = fields
    if set(records) != set(PACKAGES):
        raise ValueError('missing requested packages: ' + repr(set(PACKAGES) - set(records)))
    rows, links = [], []
    for name in PACKAGES:
        fields = records[name]
        url = fields.get('URL') or MIRROR + fields['Filename']
        print('Downloading', name, fields['Version'], flush=True)
        data = download(url)
        if hashlib.sha256(data).hexdigest() != fields['SHA256']:
            raise ValueError('package checksum mismatch: ' + name)
        links.extend(unpack(data, root))
        rows.append({'package': name, 'version': fields['Version'], 'url': url, 'sha256': fields['SHA256']})
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
    report = {'format': 'source-first-linux-sysroot/1', 'target': 'x86_64-linux-gnu',
              'package_index': INDEX, 'index_sha256': index_sha,
              'packages': rows, 'unmaterialized_links': [{'path': str(t.relative_to(root)), 'target': str(o.relative_to(root))} for t, o in links],
              'native_executable_oracle': False}
    (root / 'sysroot-manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('Header sysroot ready:', root, flush=True)

if __name__ == '__main__':
    main()
