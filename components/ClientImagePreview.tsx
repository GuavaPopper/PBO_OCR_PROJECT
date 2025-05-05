"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { DownloadIcon } from "lucide-react"
import { useEffect, useState } from "react"

// Component to display the selected image and its text
export default function ClientImagePreview({ searchParams, images }: { searchParams: { id?: string }; images: any[] }) {
  // Use state to store images to handle initial rendering and updates
  const [imageData, setImageData] = useState<any[]>(images || []);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  
  // Debug logs
  console.log("[Client] ClientImagePreview rendered, images count:", imageData?.length || 0);
  
  // Update imageData when props change
  useEffect(() => {
    if (images && images.length > 0) {
      setImageData(images);
    }
  }, [images]);
  
  // Handle searchParams changes
  useEffect(() => {
    console.log("[Client] ClientImagePreview searchParams changed:", searchParams?.id);
    setSelectedId(searchParams?.id);
  }, [searchParams]);
  
  // Update selected image when id or data changes
  useEffect(() => {
    if (!imageData || imageData.length === 0) {
      setSelectedImage(null);
      return;
    }
    
    const newSelectedImage = selectedId 
      ? imageData.find((img: any) => img && img.id && img.id.toString() === selectedId)
      : imageData[0];
      
    console.log("[Client] Selected image changed:", newSelectedImage?.id);
    setSelectedImage(newSelectedImage || null);
  }, [selectedId, imageData]);
  
  // Fetch the image by ID directly if not found in the passed images array
  useEffect(() => {
    if (selectedId && (!selectedImage || selectedImage.id.toString() !== selectedId)) {
      console.log("[Client] Fetching image by ID:", selectedId);
      
      const fetchImage = async () => {
        try {
          // First try to find it in the existing data
          const existingImage = imageData.find((img: any) => img && img.id && img.id.toString() === selectedId);
          if (existingImage) {
            console.log("[Client] Found image in existing data:", selectedId);
            setSelectedImage(existingImage);
            return;
          }
          
          // Try direct MySQL endpoint first
          const directResponse = await fetch('/api/mysql');
          if (directResponse.ok) {
            const allImages = await directResponse.json();
            if (Array.isArray(allImages)) {
              const foundImage = allImages.find((img: any) => img.id.toString() === selectedId);
              if (foundImage) {
                console.log("[Client] Found image from direct MySQL:", selectedId);
                setSelectedImage(foundImage);
                return;
              }
            }
          }
          
          // Fallback to regular API
          const response = await fetch(`/api/images/${selectedId}`);
          if (response.ok) {
            const data = await response.json();
            if (data) {
              console.log("[Client] Fetched image data from API for ID:", selectedId);
              setSelectedImage(data);
            }
          }
        } catch (error) {
          console.error("Error fetching image by ID:", error);
        }
      };
      
      fetchImage();
    }
  }, [selectedId, selectedImage, imageData]);
  
  if (!selectedImage) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Pratinjau Gambar</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
            Pilih gambar untuk melihat pratinjau
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Teks Hasil Ekstraksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] flex items-center justify-center text-muted-foreground">
              Tidak ada teks untuk ditampilkan
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  function downloadText(filename: string, text: string) {
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", `${filename.replace(/\s+/g, "-")}-ocr.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pratinjau Gambar: {selectedImage.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 w-full flex items-center justify-center">
            {selectedImage.image_path && (
              <img 
                src={selectedImage.image_path.startsWith('/') ? selectedImage.image_path : `/${selectedImage.image_path}`}
                alt={selectedImage.name}
                className="object-contain max-h-64 max-w-full"
                onError={(e) => {
                  console.error("Image failed to load:", e);
                  e.currentTarget.src = "/placeholder.jpg";
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CardTitle>Teks Hasil Ekstraksi</CardTitle>
            {selectedImage?.extracted_text && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadText(selectedImage.name, selectedImage.extracted_text)}
                title="Unduh teks"
              >
                <DownloadIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[calc(100vh-500px)] min-h-[300px] overflow-auto">
            {selectedImage.extracted_text || "Tidak ada teks yang diekstrak dari gambar ini"}
          </div>
        </CardContent>
      </Card>
    </>
  );
} 