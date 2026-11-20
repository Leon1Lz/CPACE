"use client"

/** Store a compressed image with the article so uploads survive redeployments. */
export async function prepareArticleImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.")
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose an image smaller than 10 MB.")
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement("canvas")
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Unable to prepare this image.")
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const data = canvas.toDataURL("image/webp", quality)
      if (data.length <= 700_000) return data
    }
    throw new Error("This image is too detailed. Resize it and try again.")
  } finally { bitmap.close() }
}
