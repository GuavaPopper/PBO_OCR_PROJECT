"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react"
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

export default function DeletePage() {
  const [images, setImages] = useState<ImageType[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string>("")
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
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
              setSelectedImage(foundImage)
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
      setSelectedImage(image)
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

    // Update URL with selected image ID
    router.push(`/delete?id=${id}`)
  }

  const handleDelete = async () => {
    if (!selectedImageId) return

    try {
      setIsDeleting(true)
      console.log(`[Client] Deleting image ID: ${selectedImageId}`)

      let success = false

      // Try the regular API endpoint first
      try {
        const response = await fetch(`/api/images/${selectedImageId}`, {
          method: "DELETE",
        })
        
        console.log(`[Client] Delete API response status: ${response.status}`)

        if (response.ok) {
          console.log("[Client] Successfully deleted image via API")
          success = true
        } else {
          console.error(`[Client] Failed to delete image via API: ${response.status}`)
        }
      } catch (apiError) {
        console.error("[Client] Error using API delete:", apiError)
      }

      // If API delete failed, try direct MySQL delete
      if (!success) {
        console.log("[Client] Trying MySQL direct delete")
        try {
          const mysqlResponse = await fetch(`/api/mysql?id=${selectedImageId}`, {
            method: "DELETE",
          })
          
          console.log(`[Client] MySQL delete response status: ${mysqlResponse.status}`)
          
          if (mysqlResponse.ok) {
            console.log("[Client] Successfully deleted image via MySQL")
            success = true
          } else {
            console.error("[Client] Failed to delete image via MySQL")
            const errorData = await mysqlResponse.json()
            console.error("[Client] MySQL delete error:", errorData)
            throw new Error(errorData.error || "Failed to delete image")
          }
        } catch (mysqlError) {
          console.error("[Client] Error using MySQL delete:", mysqlError)
          throw mysqlError
        }
      }

      // If we get here and success is still false, there was an error
      if (!success) {
        throw new Error("Failed to delete image via all available methods")
      }

      toast({
        title: "Image Deleted",
        description: "The image has been successfully deleted.",
      })

      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("[Client] Error deleting image:", error)
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Delete Image</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Image Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-select">Select Image to Delete</Label>
              <Select value={selectedImageId} onValueChange={handleImageSelect} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an image to delete" />
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
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isDeleting || isLoading || !selectedImageId}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Image
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the image and all associated data from
                    the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              ) : selectedImage ? (
                <div className="relative h-48 w-full">
                  <img
                    src={formatImagePath(selectedImage.image_path)}
                    alt={selectedImage.name}
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
              <CardTitle>Image Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : selectedImage ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Name</h3>
                    <p>{selectedImage.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Extracted Text</h3>
                    <p className="max-h-32 overflow-y-auto text-sm">
                      {selectedImage.extracted_text || "No text was extracted from this image"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">Select an image to view details</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
