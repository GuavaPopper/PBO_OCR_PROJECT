'use server'

import { spawn } from "child_process"
import path from "path"

// Function to execute Python database operations
// This is a server component and should not be imported in client components directly
// Use server actions or API routes to access this functionality
async function executePythonDbOperation(operation: string, params: any = {}): Promise<any> {
  console.log(`[DB] Executing operation: ${operation} with params:`, params)
  
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [path.join(process.cwd(), "python", "db_operations.py")])

    let result = ""
    let error = ""

    pythonProcess.stdout.on("data", (data) => {
      const dataString = data.toString()
      console.log(`[Python stdout] Received ${dataString.length} characters`)
      result += dataString
    })

    pythonProcess.stderr.on("data", (data) => {
      const dataString = data.toString()
      // Log stderr for debugging - this won't interfere with JSON parsing
      console.log(`[Python stderr] ${dataString.trim()}`)
      error += dataString
    })

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Database operation failed:", error)
        reject(new Error(`Database operation failed with code ${code}: ${error}`))
        return
      }

      try {
        // Log the raw result to see what we're getting back
        console.log(`[Python result] Raw result (${result.length} chars):`, result.substring(0, 100) + (result.length > 100 ? '...' : ''))
        
        const parsedResult = JSON.parse(result)
        console.log(`[Python result] Parsed result type:`, typeof parsedResult)
        
        if (parsedResult && parsedResult.success) {
          if (parsedResult.data) {
            // Return data field if it exists
            resolve(parsedResult.data)
          } else {
            // Return the whole result if no data field
            resolve(parsedResult)
          }
        } else if (parsedResult && parsedResult.error) {
          reject(new Error(parsedResult.error))
        } else {
          reject(new Error("Database operation failed: Unknown error"))
        }
      } catch (parseError) {
        console.error("Error parsing database result:", parseError)
        console.error("Raw result:", result)
        reject(new Error("Failed to parse database result"))
      }
    })

    // Send operation and parameters to Python script
    pythonProcess.stdin.write(
      JSON.stringify({
        operation,
        ...params,
      }),
    )
    pythonProcess.stdin.end()
  })
}

// Initialize the database with required tables
export async function initializeDatabase() {
  try {
    await executePythonDbOperation("initialize")
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  }
}

// Get all images with optional search filter
export async function getImages(search?: string) {
  try {
    console.log("[DB] Executing Python operation 'get_images'")
    const result = await executePythonDbOperation("get_images", { search })
    console.log("[DB] Python operation completed")
    
    // Debug log the actual structure of the result
    console.log("[DB] Result type:", typeof result)
    if (typeof result === 'object') {
      console.log("[DB] Result keys:", Object.keys(result).join(', '))
    }
    
    // Handle both formats: direct array or {data: array}
    if (Array.isArray(result)) {
      console.log(`[DB] Result is already an array with ${result.length} items`)
      return result
    } else if (result && result.data && Array.isArray(result.data)) {
      console.log(`[DB] Result has data property with ${result.data.length} items`)
      return result.data
    } else if (result && typeof result === 'object') {
      // If it's an object with numeric keys, it might be a PHP-style array
      const keys = Object.keys(result)
      if (keys.length > 0 && keys.every(key => !isNaN(Number(key)))) {
        const values = Object.values(result)
        console.log(`[DB] Result appears to be a PHP-style array with ${values.length} items`)
        return values
      }
    }
    
    console.log("[DB] Could not interpret result as array, returning empty array")
    return []
  } catch (error) {
    console.error("[DB] Error fetching images:", error)
    throw error
  }
}

// Get a single image by ID
export async function getImageById(id: number) {
  try {
    const result = await executePythonDbOperation("get_image_by_id", { id })
    return result.data || null
  } catch (error) {
    console.error("Error fetching image:", error)
    throw error
  }
}

// Add a new image
export async function addImage(name: string, imagePath: string, extractedText: string) {
  try {
    const result = await executePythonDbOperation("add_image", {
      name,
      image_path: imagePath,
      extracted_text: extractedText,
    })
    return result
  } catch (error) {
    console.error("Error adding image:", error)
    throw error
  }
}

// Update an existing image
export async function updateImage(id: number, name: string, imagePath?: string, extractedText?: string) {
  try {
    const result = await executePythonDbOperation("update_image", {
      id,
      name,
      image_path: imagePath,
      extracted_text: extractedText,
    })
    return result
  } catch (error) {
    console.error("Error updating image:", error)
    throw error
  }
}

// Delete an image
export async function deleteImage(id: number) {
  try {
    const result = await executePythonDbOperation("delete_image", { id })
    return result
  } catch (error) {
    console.error("Error deleting image:", error)
    throw error
  }
}

// No need for a pool export since we're using Python for connections
