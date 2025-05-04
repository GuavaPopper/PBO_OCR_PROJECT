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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [selectedLanguage, setSelectedLanguage] = useState("eng") // Default to English

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
              image: imageData,
              language: selectedLanguage,
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
            title: "OCR Processing Failed",
            description: "There was an error extracting text from the image.",
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
        title: "Missing Image",
        description: "Please upload an image.",
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
        title: "Image Saved",
        description: "The image has been successfully processed and saved.",
      })

      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error saving image:", error)
      toast({
        title: "Save Failed",
        description: "There was an error saving the image.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Add New Image</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Image Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-name">Image Name (Optional)</Label>
                <Input
                  id="image-name"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder={originalFileName || "Enter a name for this image (or leave blank to use file name)"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ocr-language">OCR Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger id="ocr-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="fra">French</SelectItem>
                    <SelectItem value="deu">German</SelectItem>
                    <SelectItem value="spa">Spanish</SelectItem>
                    <SelectItem value="ita">Italian</SelectItem>
                    <SelectItem value="por">Portuguese</SelectItem>
                    <SelectItem value="rus">Russian</SelectItem>
                    <SelectItem value="jpn">Japanese</SelectItem>
                    <SelectItem value="chi_sim">Chinese (Simplified)</SelectItem>
                    <SelectItem value="chi_tra">Chinese (Traditional)</SelectItem>
                    <SelectItem value="kor">Korean</SelectItem>
                    <SelectItem value="ara">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-upload">Upload Image</Label>
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
                    Select Image
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || isProcessing} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Image"
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Image Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="relative h-48 w-full">
                    <img 
                      src={imagePreview || "/placeholder.jpg"} 
                      alt="Preview" 
                      className="object-contain w-full h-full" 
                      onError={(e) => {
                        console.error("Image failed to load:", e);
                        e.currentTarget.src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md text-muted-foreground">
                    No image selected
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Extracted Text</CardTitle>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Processing image...</span>
                  </div>
                ) : (
                  <Textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="Extracted text will appear here"
                    className="min-h-[120px]"
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
