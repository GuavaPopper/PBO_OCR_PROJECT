'use server'

import { initializeDatabase } from "@/lib/db"

// Function to manually initialize the database
export async function manualInitialize() {
  try {
    console.log("Starting database initialization...")
    await initializeDatabase()
    console.log("Database initialized successfully!")
    return { success: true }
  } catch (error) {
    console.error("Database initialization failed:", error)
    return { success: false, error }
  }
} 