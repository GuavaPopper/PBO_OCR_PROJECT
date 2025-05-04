import { type NextRequest, NextResponse } from "next/server"
import { getImages, addImage } from "@/lib/db"
import { saveImage } from "@/lib/ocr"

// Initialize database on server start
import { initializeDatabase } from "@/lib/db"
initializeDatabase().catch(console.error)

// GET /api/images - Get all images
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || undefined

    const images = await getImages(search)
    return NextResponse.json(images)
  } catch (error) {
    console.error("Error fetching images:", error)
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
  }
}

// POST /api/images - Add a new image
export async function POST(request: NextRequest) {
  try {
    const { name, image, extractedText } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 })
    }

    // Use a default name if none is provided
    const nameToUse = name || `Image_${new Date().toISOString().replace(/[:.]/g, '-')}`

    // Save the image to the file system
    const imagePath = await saveImage(image, nameToUse)

    // Add the image to the database
    const result = await addImage(nameToUse, imagePath, extractedText)

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error("Error adding image:", error)
    return NextResponse.json({ error: "Failed to add image" }, { status: 500 })
  }
}
