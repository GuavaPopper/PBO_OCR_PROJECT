import { type NextRequest, NextResponse } from "next/server"
import { saveImage } from "@/lib/ocr"
import { updateImage } from "@/lib/db"

// POST /api/ocr/save - Save an image and update its path in the database
export async function POST(request: NextRequest) {
  try {
    const { image, name, id } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Image name is required" }, { status: 400 })
    }

    // Save the image to the file system
    console.log(`[API] Saving image for ${name}`)
    const imagePath = await saveImage(image, name)
    console.log(`[API] Image saved at ${imagePath}`)

    // If an ID is provided, update the image path in the database
    if (id) {
      console.log(`[API] Updating image path for ID ${id}`)
      await updateImage(id, name, imagePath)
      console.log(`[API] Database updated for ID ${id}`)
    }

    return NextResponse.json({ success: true, path: imagePath })
  } catch (error) {
    console.error("[API] Error saving image:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
} 