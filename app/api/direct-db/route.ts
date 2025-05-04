import { type NextRequest, NextResponse } from "next/server"
import mysql from 'mysql2/promise'

// GET /api/direct-db - Get images directly from the database
export async function GET(request: NextRequest) {
  try {
    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'MYSQL_PASSWORD',
      database: process.env.MYSQL_DATABASE || 'ocr_app',
    })

    // Query the database
    const [rows] = await connection.execute('SELECT * FROM images ORDER BY created_at DESC')
    
    // Close the connection
    await connection.end()
    
    // Convert date objects to strings to ensure JSON serializability
    const serializedRows = (rows as any[]).map(row => {
      return {
        ...row,
        created_at: row.created_at ? row.created_at.toISOString() : null,
        updated_at: row.updated_at ? row.updated_at.toISOString() : null,
      }
    })
    
    return NextResponse.json({
      success: true,
      images: serializedRows,
      count: serializedRows.length
    })
  } catch (error) {
    console.error("Error in direct database query:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      success: false 
    }, { status: 500 })
  }
} 