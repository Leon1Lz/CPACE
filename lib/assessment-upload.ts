const PDF_SIGNATURE = Buffer.from("%PDF-")

const officePolicy = {
  ".docx": {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    requiredEntry: "word/document.xml",
  },
  ".pptx": {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    requiredEntry: "ppt/presentation.xml",
  },
} as const

function readZipEntryNames(buffer: Buffer) {
  const minimumEocdOffset = Math.max(0, buffer.length - 65_557)
  let eocdOffset = -1
  for (let offset = buffer.length - 22; offset >= minimumEocdOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocdOffset = offset
      break
    }
  }
  if (eocdOffset < 0) return null

  const entryCount = buffer.readUInt16LE(eocdOffset + 10)
  const directorySize = buffer.readUInt32LE(eocdOffset + 12)
  const directoryOffset = buffer.readUInt32LE(eocdOffset + 16)
  if (entryCount === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) return null
  if (directoryOffset + directorySize > eocdOffset) return null

  const names: string[] = []
  let offset = directoryOffset
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > eocdOffset || buffer.readUInt32LE(offset) !== 0x02014b50) return null
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const nextOffset = offset + 46 + nameLength + extraLength + commentLength
    if (nextOffset > eocdOffset) return null
    names.push(buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8").replaceAll("\\", "/"))
    offset = nextOffset
  }
  return offset === directoryOffset + directorySize ? names : null
}

export function isAllowedAssessmentMaterial(buffer: Buffer, extension: string, mime: string) {
  if (extension === ".pdf") {
    return mime === "application/pdf" && buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)
  }
  if (extension === ".txt") {
    return mime === "text/plain" && !buffer.includes(0)
  }

  const policy = officePolicy[extension as keyof typeof officePolicy]
  if (!policy || mime !== policy.mime) return false
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) return false

  const entries = readZipEntryNames(buffer)
  if (!entries) return false
  const normalized = entries.map((entry) => entry.toLowerCase())
  const forbiddenEntry = normalized.some((entry) =>
    entry.endsWith(".bin")
    || entry.endsWith(".exe")
    || entry.endsWith(".js")
    || entry.endsWith(".html")
    || entry.endsWith(".svg")
    || entry.includes("/embeddings/"),
  )
  return !forbiddenEntry
    && normalized.includes("[content_types].xml")
    && normalized.includes(policy.requiredEntry)
}
