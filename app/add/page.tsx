"use client"

import type React from "react"

import { useState, useRef, type FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function AddPage() {
  const [imageName, setImageName] = useState("")
  const [originalFileName, setOriginalFileName] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Save original file name (without extension)
    const fileName = file.name.replace(/\.[^/.]+$/, "")
    setOriginalFileName(fileName)
    
    // If imageName is empty, set it to the file name
    if (!imageName.trim()) {
      setImageName(fileName)
    }

    // Preview the image
    const reader = new FileReader()
    reader.onload = async (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string
        setImagePreview(imageData)

        // Process the image with OCR
        try {
          setIsProcessing(true)
          const response = await fetch("/api/ocr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: imageData
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to process image")
          }

          const data = await response.json()
          setExtractedText(data.text)
        } catch (error) {
          console.error("Error processing image:", error)
          toast({
            title: "Pemrosesan OCR Gagal",
            description: "Terjadi kesalahan saat mengekstrak teks dari gambar.",
            variant: "destructive",
          })
        } finally {
          setIsProcessing(false)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!imagePreview) {
      toast({
        title: "Gambar Tidak Ditemukan",
        description: "Silakan unggah sebuah gambar.",
        variant: "destructive",
      })
      return
    }

    // Use original file name if image name is not provided
    const nameToUse = imageName.trim() || originalFileName || `Image_${new Date().toISOString().replace(/[:.]/g, '-')}`

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameToUse,
          image: imagePreview,
          extractedText,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save image")
      }

      toast({
        title: "Gambar Tersimpan",
        description: "Gambar telah berhasil diproses dan disimpan.",
      })

      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error saving image:", error)
      toast({
        title: "Penyimpanan Gagal",
        description: "Terjadi kesalahan saat menyimpan gambar.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tambah Gambar Baru</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Gambar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-name">Nama Gambar (Opsional)</Label>
                <Input
                  id="image-name"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder={originalFileName || "Masukkan nama untuk gambar ini (atau biarkan kosong untuk menggunakan nama file)"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-upload">Unggah Gambar</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Pilih Gambar
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || isProcessing} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Gambar"
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pratinjau Gambar</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="relative h-48 w-full">
                    <img 
                      src={imagePreview || "/placeholder.jpg"} 
                      alt="Pratinjau" 
                      className="object-contain w-full h-full" 
                      onError={(e) => {
                        console.error("Image failed to load:", e);
                        e.currentTarget.src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md text-muted-foreground">
                    Belum ada gambar dipilih
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teks Hasil Ekstraksi</CardTitle>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Memproses gambar...</span>
                  </div>
                ) : (
                  <Textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="Teks yang diekstrak akan muncul di sini"
                    className="min-h-[200px]"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
