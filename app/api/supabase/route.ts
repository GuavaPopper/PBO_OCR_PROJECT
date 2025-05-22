import { type NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

// GET /api/supabase - Get images from Supabase
export async function GET(request: NextRequest) {
  try {
    console.log("[API] Supabase query: Starting connection")
    
    // Query the database
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log(`[API] Supabase query: Got ${Array.isArray(data) ? data.length : 'unknown'} results`)
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[API] Supabase query error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PUT /api/supabase - Update an image in Supabase
export async function PUT(request: NextRequest) {
  try {
    console.log("[API] Supabase update: Starting")
    
    const requestData = await request.json()
    console.log("[API] Request data:", requestData)
    
    const { id, name, extractedText } = requestData
    
    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 })
    }
    
    console.log(`[API] Supabase update: Updating image ID ${id}`)
    
    // Build update object
    const updateData: any = {
      name,
      updated_at: new Date().toISOString()
    }
    
    if (extractedText !== undefined) {
      updateData.extracted_text = extractedText
    }
    
    // Execute the update
    const { error } = await supabase
      .from('images')
      .update(updateData)
      .eq('id', id)
    
    if (error) throw error
    
    console.log(`[API] Supabase update: Update complete`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Supabase update error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE /api/supabase - Delete an image from Supabase
export async function DELETE(request: NextRequest) {
  try {
    console.log("[API] Supabase delete: Starting")
    
    // Get the image ID from the query parameters
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Valid ID is required" }, { status: 400 })
    }
    
    console.log(`[API] Supabase delete: Deleting image ID ${id}`)
    
    // First get the image path to delete the file
    const { data: imageData, error: fetchError } = await supabase
      .from('images')
      .select('image_path')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError
    
    // Delete from the database
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('id', id)
    
    if (deleteError) throw deleteError
    
    console.log(`[API] Supabase delete: Database delete successful`)
    
    // Try to delete the file if we have a path
    if (imageData && imageData.image_path) {
      try {
        const fs = require('fs')
        const path = require('path')
        const filePath = path.join(process.cwd(), 'public', imageData.image_path.replace(/^\//, ''))
        console.log(`[API] Attempting to delete file at: ${filePath}`)
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`[API] File deleted: ${filePath}`)
        } else {
          console.log(`[API] File not found: ${filePath}`)
        }
      } catch (fileError) {
        console.error('[API] Error deleting file:', fileError)
        // Continue even if file deletion fails
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Supabase delete error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 