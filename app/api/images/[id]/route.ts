import { type NextRequest, NextResponse } from "next/server"
import { getImageById, updateImage, deleteImage } from "@/lib/db"
import { saveImage } from "@/lib/ocr"
import fs from "fs"
import path from "path"

// GET /api/images/[id] - Get a specific image
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params before accessing properties
    const paramsData = await params;
    const id = Number.parseInt(paramsData.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
    }

    const image = await getImageById(id)

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    return NextResponse.json(image)
  } catch (error) {
    console.error("Error fetching image:", error)
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
  }
}

// PUT /api/images/[id] - Update an image
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params before accessing properties
    const paramsData = await params;
    const id = Number.parseInt(paramsData.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
    }

    const { name, image, extractedText } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if the image exists
    const existingImage = await getImageById(id)

    if (!existingImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    let imagePath = undefined
    const newExtractedText = extractedText

    // If a new image is provided, save it and process with OCR
    if (image) {
      imagePath = await saveImage(image, name)
    }

    // Update the image in the database
    await updateImage(id, name, imagePath, newExtractedText)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating image:", error)
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 })
  }
}

// DELETE /api/images/[id] - Delete an image
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Await params before accessing properties
    const paramsData = await params;
    const id = Number.parseInt(paramsData.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
    }

    // Check if the image exists
    const image = await getImageById(id)

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Delete the image file from the file system
    try {
      const filePath = path.join(process.cwd(), "public", image.image_path)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (fileError) {
      console.error("Error deleting image file:", fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete the image from the database
    await deleteImage(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}
