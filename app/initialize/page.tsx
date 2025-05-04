'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { manualInitialize } from "../initialize"

export default function InitializePage() {
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  const handleInitialize = async () => {
    try {
      setLoading(true)
      setStatus("Initializing database...")
      const result = await manualInitialize()
      
      if (result.success) {
        setStatus("Database initialized successfully!")
      } else {
        setStatus(`Initialization failed: ${result.error}`)
      }
    } catch (error) {
      setStatus(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Initialization</h1>
      <p className="mb-4">
        This page will initialize the database tables needed for the application.
      </p>
      <Button onClick={handleInitialize} disabled={loading}>
        {loading ? "Initializing..." : "Initialize Database"}
      </Button>
      
      {status && (
        <div className="mt-4 p-4 border rounded">
          <p>{status}</p>
        </div>
      )}
    </div>
  )
} 