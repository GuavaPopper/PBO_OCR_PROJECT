import { type NextRequest, NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

// GET /api/direct-db - Get images directly from the database
export async function GET(request: NextRequest) {
  try {
    // Query the Supabase database
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      images: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error("Error in direct database query:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      success: false 
    }, { status: 500 })
  }
} 