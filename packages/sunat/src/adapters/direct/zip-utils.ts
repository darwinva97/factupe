/**
 * ZIP Utilities for SUNAT Documents
 *
 * Handles compression and decompression of XML documents
 * as required by SUNAT webservices.
 *
 * @module sunat/adapters/direct/zip-utils
 */

import * as zlib from 'zlib'

/**
 * Simple ZIP implementation for SUNAT requirements
 * Creates a ZIP file with a single XML entry
 */

// ZIP file signatures
const LOCAL_FILE_HEADER = 0x04034b50
const CENTRAL_DIR_HEADER = 0x02014b50
const END_OF_CENTRAL_DIR = 0x06054b50

/**
 * Create a ZIP file containing the XML document
 *
 * @param filename - Name for the XML file (without extension)
 * @param xmlContent - XML content to compress
 * @returns ZIP file as Buffer
 */
export async function zipDocument(filename: string, xmlContent: string): Promise<Buffer> {
  const xmlBuffer = Buffer.from(xmlContent, 'utf8')
  const xmlFilename = `${filename}.xml`

  // Compress the content
  const compressedData = await new Promise<Buffer>((resolve, reject) => {
    zlib.deflateRaw(xmlBuffer, { level: 9 }, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })

  // Calculate CRC32
  const crc32 = calculateCRC32(xmlBuffer)

  // Current timestamp for DOS format
  const now = new Date()
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff

  // Build local file header
  const filenameBuffer = Buffer.from(xmlFilename, 'utf8')
  const localHeaderSize = 30 + filenameBuffer.length
  const localHeader = Buffer.alloc(localHeaderSize)

  let offset = 0
  localHeader.writeUInt32LE(LOCAL_FILE_HEADER, offset); offset += 4
  localHeader.writeUInt16LE(20, offset); offset += 2 // Version needed
  localHeader.writeUInt16LE(0, offset); offset += 2 // Flags
  localHeader.writeUInt16LE(8, offset); offset += 2 // Compression method (deflate)
  localHeader.writeUInt16LE(dosTime, offset); offset += 2
  localHeader.writeUInt16LE(dosDate, offset); offset += 2
  localHeader.writeUInt32LE(crc32, offset); offset += 4
  localHeader.writeUInt32LE(compressedData.length, offset); offset += 4
  localHeader.writeUInt32LE(xmlBuffer.length, offset); offset += 4
  localHeader.writeUInt16LE(filenameBuffer.length, offset); offset += 2
  localHeader.writeUInt16LE(0, offset); offset += 2 // Extra field length
  filenameBuffer.copy(localHeader, offset)

  // Build central directory header
  const centralHeaderSize = 46 + filenameBuffer.length
  const centralHeader = Buffer.alloc(centralHeaderSize)

  offset = 0
  centralHeader.writeUInt32LE(CENTRAL_DIR_HEADER, offset); offset += 4
  centralHeader.writeUInt16LE(20, offset); offset += 2 // Version made by
  centralHeader.writeUInt16LE(20, offset); offset += 2 // Version needed
  centralHeader.writeUInt16LE(0, offset); offset += 2 // Flags
  centralHeader.writeUInt16LE(8, offset); offset += 2 // Compression method
  centralHeader.writeUInt16LE(dosTime, offset); offset += 2
  centralHeader.writeUInt16LE(dosDate, offset); offset += 2
  centralHeader.writeUInt32LE(crc32, offset); offset += 4
  centralHeader.writeUInt32LE(compressedData.length, offset); offset += 4
  centralHeader.writeUInt32LE(xmlBuffer.length, offset); offset += 4
  centralHeader.writeUInt16LE(filenameBuffer.length, offset); offset += 2
  centralHeader.writeUInt16LE(0, offset); offset += 2 // Extra field length
  centralHeader.writeUInt16LE(0, offset); offset += 2 // Comment length
  centralHeader.writeUInt16LE(0, offset); offset += 2 // Disk number
  centralHeader.writeUInt16LE(0, offset); offset += 2 // Internal attributes
  centralHeader.writeUInt32LE(0, offset); offset += 4 // External attributes
  centralHeader.writeUInt32LE(0, offset); offset += 4 // Offset of local header
  filenameBuffer.copy(centralHeader, offset)

  // Build end of central directory
  const centralDirOffset = localHeaderSize + compressedData.length
  const endRecord = Buffer.alloc(22)

  offset = 0
  endRecord.writeUInt32LE(END_OF_CENTRAL_DIR, offset); offset += 4
  endRecord.writeUInt16LE(0, offset); offset += 2 // Disk number
  endRecord.writeUInt16LE(0, offset); offset += 2 // Disk with central dir
  endRecord.writeUInt16LE(1, offset); offset += 2 // Entries on this disk
  endRecord.writeUInt16LE(1, offset); offset += 2 // Total entries
  endRecord.writeUInt32LE(centralHeaderSize, offset); offset += 4 // Central dir size
  endRecord.writeUInt32LE(centralDirOffset, offset); offset += 4 // Central dir offset
  endRecord.writeUInt16LE(0, offset) // Comment length

  // Combine all parts
  return Buffer.concat([localHeader, compressedData, centralHeader, endRecord])
}

/**
 * Extract XML content from SUNAT CDR ZIP response
 *
 * @param zipBuffer - ZIP file buffer
 * @returns Extracted XML content
 */
export async function unzipResponse(zipBuffer: Buffer): Promise<string> {
  // Find local file header
  if (zipBuffer.readUInt32LE(0) !== LOCAL_FILE_HEADER) {
    throw new Error('Invalid ZIP file')
  }

  // Parse local file header
  const compressionMethod = zipBuffer.readUInt16LE(8)
  const compressedSize = zipBuffer.readUInt32LE(18)
  const filenameLength = zipBuffer.readUInt16LE(26)
  const extraLength = zipBuffer.readUInt16LE(28)

  const dataOffset = 30 + filenameLength + extraLength
  const compressedData = zipBuffer.subarray(dataOffset, dataOffset + compressedSize)

  // Decompress
  if (compressionMethod === 8) {
    // Deflate
    const decompressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.inflateRaw(compressedData, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    return decompressed.toString('utf8')
  } else if (compressionMethod === 0) {
    // Stored (no compression)
    return compressedData.toString('utf8')
  }

  throw new Error(`Unsupported compression method: ${compressionMethod}`)
}

/**
 * Calculate CRC32 checksum
 */
function calculateCRC32(buffer: Buffer): number {
  // CRC32 lookup table
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c
  }

  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i++) {
    crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}
