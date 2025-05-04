"use client"

import type React from "react"

import { useState, useRef, useEffect, type FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface ImageType {
  id: number
  name: string
  image_path: string
  extracted_text: string
}

// Utility function to ensure image paths are correctly formatted
const formatImagePath = (path: string | null): string => {
  if (!path) return "/placeholder.jpg";
  
  // If path starts with data:image, it's a base64 image
  if (path.startsWith("data:image")) {
    return path;
  }
  
  // Ensure path starts with a slash
  return path.startsWith("/") ? path : `/${path}`;
};

export default function EditPage() {
  const [images, setImages] = useState<ImageType[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string>("")
  const [imageName, setImageName] = useState("")
  const [currentImagePath, setCurrentImagePath] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Load images on component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/images")
        if (!response.ok) {
          throw new Error("Failed to fetch images")
        }
        const data = await response.json()
        setImages(data)
        setIsLoading(false)

        // Check if an ID is provided in the URL
        const idFromUrl = searchParams.get("id")
        if (idFromUrl) {
          setSelectedImageId(idFromUrl)
          loadImageDetails(idFromUrl)
        }
      } catch (error) {
        console.error("Error fetching images:", error)
        toast({
          title: "Error",
          description: "Failed to load images.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [searchParams, toast])

  const loadImageDetails = async (id: string, retryCount = 0) => {
    try {
      setIsLoading(true)
      console.log(`[Client] Loading image details for ID: ${id}, retry #${retryCount}`)
      
      // Try the regular API endpoint first
      let response = await fetch(`/api/images/${id}`)
      console.log(`[Client] API response status: ${response.status}`)
      
      // If that fails, try the direct MySQL API endpoint as fallback
      if (!response.ok) {
        console.log("[Client] Regular API failed, trying MySQL direct endpoint")
        const directResponse = await fetch(`/api/mysql`)
        console.log(`[Client] MySQL API response status: ${directResponse.status}`)
        
        if (directResponse.ok) {
          const allImages = await directResponse.json()
          console.log(`[Client] MySQL returned ${Array.isArray(allImages) ? allImages.length : 'non-array'} images`)
          
          if (Array.isArray(allImages)) {
            const foundImage = allImages.find(img => img.id.toString() === id)
            if (foundImage) {
              console.log(`[Client] Found image in MySQL data: ${foundImage.name}`)
              setImageName(foundImage.name)
              setCurrentImagePath(foundImage.image_path)
              setExtractedText(foundImage.extracted_text || "")
              setImagePreview(null)
              setIsLoading(false)
              return
            } else {
              console.log(`[Client] Image with ID ${id} not found in MySQL data`)
            }
          }
        }
        
        // Try one more time if we haven't exceeded retry limit
        if (retryCount < 2) {
          console.log(`[Client] Retrying image fetch (${retryCount + 1}/2)`)
          setIsLoading(false)
          // Wait a bit before retrying
          setTimeout(() => {
            loadImageDetails(id, retryCount + 1)
          }, 1000)
          return
        }
        
        throw new Error(`Failed to fetch image details for ID: ${id}`)
      }

      const image = await response.json()
      console.log(`[Client] Successfully loaded image: ${image.name}`)
      setImageName(image.name)
      setCurrentImagePath(image.image_path)
      setExtractedText(image.extracted_text || "")
      setImagePreview(null) // Reset image preview for new upload
      setIsLoading(false)
    } catch (error) {
      console.error("[Client] Error loading image details:", error)
      toast({
        title: "Error",
        description: "Failed to load image details. Please try refreshing the page.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleImageSelect = (id: string) => {
    setSelectedImageId(id)
    loadImageDetails(id)
    updateUrlWithId(id)
  }

  const updateUrlWithId = (id: string) => {
    // Update URL with selected image ID
    router.push(`/edit?id=${id}`, { scroll: false })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
            body: JSON.stringify({ image: imageData }),
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

    if (!selectedImageId || !imageName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an image and provide a name.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log("[Client] Submitting image update for ID:", selectedImageId)

      // First try the direct MySQL API endpoint
      let success = false
      try {
        console.log("[Client] Trying direct MySQL update")
        const mysqlResponse = await fetch(`/api/mysql`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: Number(selectedImageId),
            name: imageName,
            extractedText: extractedText || ""
          }),
        })

        console.log(`[Client] MySQL update response status: ${mysqlResponse.status}`)
        
        if (mysqlResponse.ok) {
          console.log("[Client] MySQL update successful")
          success = true

          // If we have a new image to upload, we need to handle that separately
          if (imagePreview) {
            console.log("[Client] Uploading new image")
            // Use the saveImage API to save the new image
            const saveResponse = await fetch(`/api/ocr/save`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image: imagePreview,
                name: imageName,
                id: Number(selectedImageId)
              }),
            })

            console.log(`[Client] Image save response status: ${saveResponse.status}`)
            
            if (!saveResponse.ok) {
              console.error("[Client] Failed to save new image")
              toast({
                title: "Partial Update",
                description: "Image information was updated but failed to save the new image.",
                variant: "destructive",
              })
            } else {
              const saveData = await saveResponse.json();
              console.log(`[Client] Image saved at path: ${saveData.path}`)
            }
          }
        }
      } catch (mysqlError) {
        console.error("[Client] MySQL update error:", mysqlError)
        // Continue to try the regular API if MySQL update fails
      }

      // If MySQL update failed, try the regular API
      if (!success) {
        console.log("[Client] MySQL update failed, trying regular API")
        const response = await fetch(`/api/images/${selectedImageId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: imageName,
            image: imagePreview, // Will be null if no new image was uploaded
            extractedText,
          }),
        })

        console.log(`[Client] Regular API response status: ${response.status}`)
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("[Client] API error details:", errorData);
          throw new Error(`Failed to update image: ${errorData.error || response.statusText}`)
        }
        
        console.log("[Client] Regular API update successful")
      }

      toast({
        title: "Image Updated",
        description: "The image has been successfully updated.",
      })

      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("[Client] Error updating image:", error)
      toast({
        title: "Update Failed",
        description: "There was an error updating the image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Image</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Image Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-select">Select Image</Label>
                <Select value={selectedImageId} onValueChange={handleImageSelect} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an image to edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {images.map((image) => (
                      <SelectItem key={image.id} value={image.id.toString()}>
                        {image.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedImageId && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="image-name">Image Name</Label>
                    <Input
                      id="image-name"
                      value={imageName}
                      onChange={(e) => setImageName(e.target.value)}
                      placeholder="Enter a name for this image"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Upload New Image (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="image-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Select New Image
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isSubmitting || isProcessing || isLoading || !selectedImageId}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Image"
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
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : selectedImageId ? (
                  <div className="relative h-48 w-full">
                    {imagePreview || currentImagePath ? (
                      <img 
                        src={formatImagePath(imagePreview || currentImagePath)} 
                        alt={imageName} 
                        className="object-contain w-full h-full" 
                        onError={(e) => {
                          console.error("Image failed to load:", e);
                          e.currentTarget.src = "/placeholder.jpg";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full border-2 border-dashed rounded-md text-muted-foreground">
                        No image available
                      </div>
                    )}
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
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isProcessing ? (
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
                    disabled={!selectedImageId}
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
