"""Encode original native indexed pixels and palette as PNG; no synthetic image data."""
import hashlib
import json
import struct
import sys
import zlib
from pathlib import Path

metadata_path = Path(sys.argv[1])
metadata = json.loads(metadata_path.read_text(encoding="utf-8-sig"))
pixels_path = metadata_path.parent / metadata["pixelsFile"]
palette_path = metadata_path.parent / metadata["paletteFile"]
output_path = metadata_path.parent / metadata["pngFile"]
pixels, palette = pixels_path.read_bytes(), palette_path.read_bytes()
width, height, stride = metadata["width"], metadata["height"], metadata["stride"]
if len(pixels) != stride * height or len(palette) != 1024 or not 0 < width <= stride:
    raise ValueError("Native framebuffer or original palette dimensions do not match metadata")
if hashlib.sha256(pixels).hexdigest() != metadata["pixelsSha256"] or hashlib.sha256(palette).hexdigest() != metadata["paletteSha256"]:
    raise ValueError("Native frame bytes do not match capture metadata")

def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)

# Original softsurface_setPalette consumes unsigned r/g/b bytes at offsets 0/1/2
# of each four-byte palette_t. It applies no extra factor of four here.
rgb_palette = bytes(palette[i * 4 + channel] for i in range(256) for channel in range(3))
scanlines = b"".join(b"\0" + pixels[row * stride:row * stride + width] for row in range(height))
png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 3, 0, 0, 0))
       + chunk(b"PLTE", rgb_palette) + chunk(b"IDAT", zlib.compress(scanlines, 9)) + chunk(b"IEND", b""))
output_path.write_bytes(png)
metadata["pngSha256"] = hashlib.sha256(png).hexdigest()
metadata["distinctPixelIndices"] = len(set(pixels[row * stride + col] for row in range(height) for col in range(width)))
metadata["rgbPaletteMaximum"] = max(rgb_palette)
metadata["pngEncoding"] = "PNG indexed 8-bit; original palette RGB bytes; original framebuffer rows with native stride"
metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"png": str(output_path), "sha256": metadata["pngSha256"], "distinctPixelIndices": metadata["distinctPixelIndices"]}))
