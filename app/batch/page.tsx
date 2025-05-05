"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload, FileText, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface BatchFile {
  id: string
  file: File
  name: string
  status: "pending" | "processing" | "success" | "error"
  preview?: string
  text?: string
  error?: string
}

export default function BatchPage() {
  const [files, setFiles] = useState<BatchFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    const newFiles = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      status: "pending" as const,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const processFiles = async () => {
    if (files.length === 0 || isProcessing) return

    setIsProcessing(true)
    setProgress(0)

    let processed = 0
    const totalFiles = files.length

    // Process files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // Update status to processing
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "processing" } : f)))

        // Read file as data URL
        const imageData = await readFileAsDataURL(file.file)

        // Process with OCR
        const response = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageData }),
        })

        if (!response.ok) {
          throw new Error("OCR processing failed")
        }

        const data = await response.json()

        // Save to database
        const saveResponse = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            image: imageData,
            extractedText: data.text,
          }),
        })

        if (!saveResponse.ok) {
          throw new Error("Failed to save image")
        }

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "success",
                  preview: imageData,
                  text: data.text,
                }
              : f,
          ),
        )
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)

        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Unknown error",
                }
              : f,
          ),
        )
      }

      // Update progress
      processed++
      setProgress(Math.round((processed / totalFiles) * 100))
    }

    setIsProcessing(false)

    // Show toast with results
    const successCount = files.filter((f) => f.status === "success").length
    const errorCount = files.filter((f) => f.status === "error").length

    toast({
      title: "Pemrosesan Batch Selesai",
      description: `Berhasil memproses ${successCount} dari ${totalFiles} gambar. ${errorCount} gagal.`,
      variant: successCount === totalFiles ? "default" : "destructive",
    })
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pemrosesan Gambar Massal</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Unggah Beberapa Gambar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Pilih Gambar</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Pilih Gambar
                </Button>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  {files.length} file{files.length !== 1 ? "" : ""} dipilih
                </div>

                <div className="border rounded-md divide-y">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {file.status === "pending" && "Menunggu"}
                            {file.status === "processing" && "Memproses..."}
                            {file.status === "success" && "Berhasil diproses"}
                            {file.status === "error" && `Kesalahan: ${file.error || "Gagal memproses"}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        {file.status === "success" && <Check className="h-4 w-4 text-green-500" />}
                        {file.status === "error" && <X className="h-4 w-4 text-red-500" />}
                        <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} disabled={isProcessing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progres</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/")} disabled={isProcessing}>
              Batal
            </Button>
            <Button onClick={processFiles} disabled={files.length === 0 || isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Mulai Proses"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
