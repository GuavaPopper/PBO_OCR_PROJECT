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
          title: "Kesalahan",
          description: "Gagal memuat gambar.",
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
      
      // If that fails, try the direct Supabase API endpoint as fallback
      if (!response.ok) {
        console.log("[Client] Regular API failed, trying Supabase direct endpoint")
        const directResponse = await fetch(`/api/supabase`)
        console.log(`[Client] Supabase API response status: ${directResponse.status}`)
        
        if (directResponse.ok) {
          const allImages = await directResponse.json()
          console.log(`[Client] Supabase returned ${Array.isArray(allImages) ? allImages.length : 'non-array'} images`)
          
          if (Array.isArray(allImages)) {
            const foundImage = allImages.find(img => img.id.toString() === id)
            if (foundImage) {
              console.log(`[Client] Found image in Supabase data: ${foundImage.name}`)
              setSelectedImage(foundImage)
              setIsLoading(false)
              return
            } else {
              console.log(`[Client] Image with ID ${id} not found in Supabase data`)
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
        title: "Kesalahan",
        description: "Gagal memuat detail gambar. Silakan segarkan halaman.",
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

      // If API delete failed, try direct Supabase delete
      if (!success) {
        console.log("[Client] Trying Supabase direct delete")
        try {
          const supabaseResponse = await fetch(`/api/supabase?id=${selectedImageId}`, {
            method: "DELETE",
          })
          
          console.log(`[Client] Supabase delete response status: ${supabaseResponse.status}`)
          
          if (supabaseResponse.ok) {
            console.log("[Client] Successfully deleted image via Supabase")
            success = true
          } else {
            console.error("[Client] Failed to delete image via Supabase")
            const errorData = await supabaseResponse.json()
            console.error("[Client] Supabase delete error:", errorData)
            throw new Error(errorData.error || "Failed to delete image")
          }
        } catch (supabaseError) {
          console.error("[Client] Error using Supabase delete:", supabaseError)
          throw supabaseError
        }
      }

      // If we get here and success is still false, there was an error
      if (!success) {
        throw new Error("Failed to delete image via all available methods")
      }

      toast({
        title: "Gambar Dihapus",
        description: "Gambar telah berhasil dihapus.",
      })

      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("[Client] Error deleting image:", error)
      toast({
        title: "Penghapusan Gagal",
        description: "Terjadi kesalahan saat menghapus gambar. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hapus Gambar</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pilih Gambar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-select">Pilih Gambar untuk Dihapus</Label>
              <Select value={selectedImageId} onValueChange={handleImageSelect} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gambar untuk dihapus" />
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={isDeleting || !selectedImageId}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menghapus...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Gambar
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus gambar ini? Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pratinjau Gambar</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedImage ? (
                <div className="relative h-48 w-full">
                  <img
                    src={formatImagePath(selectedImage.image_path)}
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
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="min-h-[200px] max-h-[calc(100vh-500px)] overflow-auto">
                  {selectedImage?.extracted_text || "Tidak ada teks yang diekstrak"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
