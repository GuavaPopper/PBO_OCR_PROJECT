import { type NextRequest, NextResponse } from "next/server"
import { processImageWithOCR } from "@/lib/ocr"

// POST /api/ocr - Process an image with OCR
export async function POST(request: NextRequest) {
  try {
    const { image, language = "eng" } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 })
    }

    // Process the image with OCR using the specified language
    const extractedText = await processImageWithOCR(image, language)

    return NextResponse.json({ text: extractedText })
  } catch (error) {
    console.error("Error processing image with OCR:", error)
    return NextResponse.json({ error: "Failed to process image with OCR" }, { status: 500 })
  }
}
