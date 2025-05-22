import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { spawn } from "child_process"
import path from "path"

// Helper function to get images from Supabase
async function getImages() {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// GET /api/debug - Get diagnostic information
export async function GET(request: NextRequest) {
  try {
    // Get images directly from the database
    const images = await getImages()
    
    // Check environment variables
    const env = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'not set',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'not set',
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