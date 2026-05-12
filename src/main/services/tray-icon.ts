import { deflateSync } from 'zlib'

// CRC32 lookup table for PNG chunk integrity
const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c
  }
  return table
})()

function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = crc32(Buffer.concat([typeBuf, data]))
  const len = Buffer.allocUnsafe(4)
  const crcBuf = Buffer.allocUnsafe(4)
  len.writeUInt32BE(data.length, 0)
  crcBuf.writeUInt32BE(crc, 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// Creates a 16x16 RGBA PNG with a blue circle (brand color #4073ff)
export function createTrayIconBuffer(): Buffer {
  const size = 16
  const rows: Buffer[] = []

  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 4)
    row[0] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2 + 0.5
      const cy = y - size / 2 + 0.5
      const dist = Math.sqrt(cx * cx + cy * cy)
      const inCircle = dist <= size / 2 - 1
      const onEdge = dist > size / 2 - 2 && dist <= size / 2 - 1
      const off = 1 + x * 4
      if (inCircle) {
        row[off] = onEdge ? 30 : 64       // R
        row[off + 1] = onEdge ? 60 : 115   // G
        row[off + 2] = onEdge ? 200 : 255  // B
        row[off + 3] = 255                 // A
      } else {
        row[off] = row[off + 1] = row[off + 2] = row[off + 3] = 0
      }
    }
    rows.push(row)
  }

  const raw = Buffer.concat(rows)
  const compressed = deflateSync(raw)

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // RGBA
  ihdr[10] = ihdr[11] = ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG magic
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}
