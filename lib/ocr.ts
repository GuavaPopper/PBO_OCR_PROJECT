import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { optimizeImageForStorage, preprocessImageForOCR } from "./image-processing"
import { spawn } from "child_process"

export async function saveImage(base64Image: string, fileName: string): Promise<string> {
  try {
    // Extract the base64 data
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Preprocess and optimize the image
    const preprocessedBuffer = await preprocessImageForOCR(buffer)
    const optimizedBuffer = await optimizeImageForStorage(preprocessedBuffer)

    // Generate a unique file name
    const timestamp = Date.now()
    const uniqueFileName = `${fileName.replace(/\s+/g, "-")}-${timestamp}-${uuidv4().substring(0, 8)}.jpg`

    // Define the image path
    const imagePath = path.join(process.cwd(), "public", "uploads", uniqueFileName)
    const relativePath = `/uploads/${uniqueFileName}`

    // Ensure the 'uploads' directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    try {
      await fs.mkdir(uploadsDir, { recursive: true })
    } catch (mkdirError: any) {
      if (mkdirError.code !== "EEXIST") {
        console.error("Error creating uploads directory:", mkdirError)
        throw mkdirError
      }
    }

    // Save the image to the file system
    await fs.writeFile(imagePath, optimizedBuffer)

    return relativePath
  } catch (error) {
    console.error("Error saving image:", error)
    throw error
  }
}

export async function processImageWithOCR(base64Image: string, language = "eng"): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [path.join(process.cwd(), "python", "ocr_service.py")])

    let result = ""
    let error = ""

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString()
    })

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("OCR process failed:", error)
        reject(new Error(`OCR process failed with code ${code}: ${error}`))
        return
      }

      try {
        const parsedResult = JSON.parse(result)
        if (parsedResult.success) {
          resolve(parsedResult.text)
        } else {
          reject(new Error(parsedResult.error || "OCR processing failed"))
        }
      } catch (parseError) {
        console.error("Error parsing OCR result:", parseError)
        reject(new Error("Failed to parse OCR result"))
      }
    })

    pythonProcess.stdin.write(JSON.stringify({ image: base64Image, language: language }))
    pythonProcess.stdin.end()
  })
}
