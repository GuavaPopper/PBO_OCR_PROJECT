import { type NextRequest, NextResponse } from "next/server"
import { getImages } from "@/lib/db"
import { spawn } from "child_process"
import path from "path"

// GET /api/debug - Get diagnostic information
export async function GET(request: NextRequest) {
  try {
    // Get images directly from the database
    const images = await getImages()
    
    // Check environment variables
    const env = {
      MYSQL_HOST: process.env.MYSQL_HOST || 'not set',
      MYSQL_USER: process.env.MYSQL_USER || 'not set',
      MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'not set',
      // Don't expose password
      MYSQL_PASSWORD_SET: process.env.MYSQL_PASSWORD ? 'true' : 'false',
    }
    
    // Run a direct Python check
    const pythonResult = await runPythonCheck()
    
    return NextResponse.json({
      images,
      imageCount: images.length,
      env,
      pythonResult,
      success: true
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      success: false 
    }, { status: 500 })
  }
}

// Run a direct Python check
async function runPythonCheck() {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [path.join(process.cwd(), "python", "check_db_tables.py")])

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
        resolve({
          success: false,
          error
        })
        return
      }

      resolve({
        success: true,
        result
      })
    })
  })
} 