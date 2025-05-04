import sharp from "sharp"

export async function preprocessImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Convert to grayscale and increase contrast for better OCR results
    return await sharp(imageBuffer)
      .grayscale()
      .normalize() // Normalize the image (stretch histogram)
      .sharpen() // Sharpen the image
      .threshold(128) // Apply binary threshold for text
      .toBuffer()
  } catch (error) {
    console.error("Error preprocessing image:", error)
    return imageBuffer // Return original if processing fails
  }
}

export async function optimizeImageForStorage(imageBuffer: Buffer, quality = 80): Promise<Buffer> {
  try {
    // Resize large images and compress for storage efficiency
    const metadata = await sharp(imageBuffer).metadata()

    // Only resize if the image is larger than 1200px on any dimension
    if ((metadata.width && metadata.width > 1200) || (metadata.height && metadata.height > 1200)) {
      return await sharp(imageBuffer)
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toBuffer()
    }

    // Otherwise just compress
    return await sharp(imageBuffer).jpeg({ quality }).toBuffer()
  } catch (error) {
    console.error("Error optimizing image:", error)
    return imageBuffer // Return original if processing fails
  }
}
