'use server'

import { getImages as dbGetImages, getImageById, addImage, updateImage, deleteImage } from "@/lib/db"

// Server action to get all images
export async function getImages(search?: string) {
  try {
    console.log("[Server] Fetching images, search:", search || "none")
    const result = await dbGetImages(search)
    console.log("[Server] Images fetched successfully")
    
    // Print structure of result to understand what's being returned
    console.log("[Server] Result structure:", 
      result === null ? "null" : 
      Array.isArray(result) ? `Array with ${result.length} items` : 
      typeof result === 'object' ? `Object with keys: ${Object.keys(result).join(', ')}` : 
      typeof result
    )
    
    // If it's an array, log the first item
    if (Array.isArray(result) && result.length > 0) {
      console.log("[Server] First item:", JSON.stringify(result[0]))
    }
    
    return result
  } catch (error) {
    console.error("[Server] Error in getImages action:", error)
    throw new Error("Failed to fetch images")
  }
}

// Server action to get a single image
export async function fetchImageById(id: number) {
  try {
    return await getImageById(id)
  } catch (error) {
    console.error("Error in fetchImageById action:", error)
    throw new Error("Failed to fetch image")
  }
}

// Server action to add a new image
export async function createImage(name: string, imagePath: string, extractedText: string) {
  try {
    return await addImage(name, imagePath, extractedText)
  } catch (error) {
    console.error("Error in createImage action:", error)
    throw new Error("Failed to create image")
  }
}

// Server action to update an image
export async function updateImageRecord(id: number, name: string, imagePath?: string, extractedText?: string) {
  try {
    return await updateImage(id, name, imagePath, extractedText)
  } catch (error) {
    console.error("Error in updateImageRecord action:", error)
    throw new Error("Failed to update image")
  }
}

// Server action to delete an image
export async function removeImage(id: number) {
  try {
    return await deleteImage(id)
  } catch (error) {
    console.error("Error in removeImage action:", error)
    throw new Error("Failed to delete image")
  }
} 