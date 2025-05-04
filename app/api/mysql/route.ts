import { type NextRequest, NextResponse } from "next/server"
import mysql from 'mysql2/promise'

// GET /api/mysql - Get images directly from MySQL
export async function GET(request: NextRequest) {
  try {
    console.log("[API] Direct MySQL query: Starting connection")
    
    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'MYSQL_PASSWORD',
      database: process.env.MYSQL_DATABASE || 'ocr_app',
    })
    
    console.log("[API] Direct MySQL query: Connected, executing query")
    
    // Query the database
    const [rows] = await connection.execute('SELECT * FROM images ORDER BY created_at DESC')
    
    console.log(`[API] Direct MySQL query: Got ${Array.isArray(rows) ? rows.length : 'unknown'} results`)
    
    // Close the connection
    await connection.end()
    
    // Convert date objects to strings to ensure JSON serializability
    const serializedRows = Array.isArray(rows) ? rows.map((row: any) => ({
      ...row,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    })) : []
    
    return NextResponse.json(serializedRows)
  } catch (error) {
    console.error("[API] Direct MySQL query error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PUT /api/mysql - Update an image directly in MySQL
export async function PUT(request: NextRequest) {
  try {
    console.log("[API] Direct MySQL update: Starting connection")
    
    const requestData = await request.json()
    console.log("[API] Request data:", requestData)
    
    const { id, name, extractedText } = requestData
    
    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 })
    }
    
    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'MYSQL_PASSWORD',
      database: process.env.MYSQL_DATABASE || 'ocr_app',
    })
    
    console.log(`[API] Direct MySQL update: Connected, updating image ID ${id}`)
    
    // Build the update SQL query and parameters
    let sql = 'UPDATE images SET name = ?, updated_at = NOW()'
    const params: any[] = [name]
    
    if (extractedText !== undefined) {
      sql += ', extracted_text = ?'
      params.push(extractedText)
    }
    
    sql += ' WHERE id = ?'
    params.push(id)
    
    console.log(`[API] Direct MySQL update: SQL: ${sql}`)
    console.log(`[API] Direct MySQL update: Params:`, params)
    
    // Execute the update
    const [result] = await connection.execute(sql, params)
    
    // Close the connection
    await connection.end()
    
    console.log(`[API] Direct MySQL update: Update complete:`, result)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Direct MySQL update error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE /api/mysql - Delete an image directly from MySQL
export async function DELETE(request: NextRequest) {
  try {
    console.log("[API] Direct MySQL delete: Starting connection")
    
    // Get the image ID from the query parameters
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Valid ID is required" }, { status: 400 })
    }
    
    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'MYSQL_PASSWORD',
      database: process.env.MYSQL_DATABASE || 'ocr_app',
    })
    
    console.log(`[API] Direct MySQL delete: Connected, deleting image ID ${id}`)
    
    // First get the image path to delete the file
    const [rows] = await connection.execute('SELECT image_path FROM images WHERE id = ?', [id])
    
    // Delete from the database
    const [result] = await connection.execute('DELETE FROM images WHERE id = ?', [id])
    console.log(`[API] Direct MySQL delete: Database delete result:`, result)
    
    // Close the connection
    await connection.end()
    
    // Try to delete the file if we have a path
    if (Array.isArray(rows) && rows.length > 0 && (rows[0] as any).image_path) {
      try {
        const fs = require('fs')
        const path = require('path')
        const filePath = path.join(process.cwd(), 'public', (rows[0] as any).image_path.replace(/^\//, ''))
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
    console.error("[API] Direct MySQL delete error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 