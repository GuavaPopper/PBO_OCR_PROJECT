"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Format date consistently in YYYY-MM-DD format to avoid hydration issues
const formatDate = (dateString: string) => {
  if (!dateString) return "Unknown";
  
  try {
    const date = new Date(dateString);
    
    // Use ISO string format and extract just the date part (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid date";
  }
};

export default function ClientImageList({ initialImages }: { initialImages: any[] }) {
  const [images, setImages] = useState<any[]>(initialImages);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredImages, setFilteredImages] = useState<any[]>(initialImages);
  const router = useRouter();
  
  // Add debug logs
  console.log("[Client] ClientImageList rendered, initial images:", initialImages.length)
  
  // Force client-side refresh of images on mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        // First try direct MySQL endpoint
        const response = await fetch('/api/mysql');
        if (response.ok) {
          const data = await response.json();
          console.log("[Client] Fetched fresh images from direct MySQL:", Array.isArray(data) ? data.length : 'not array');
          if (Array.isArray(data) && data.length > 0) {
            setImages(data);
            return;
          }
        }
        
        // Fallback to regular API
        const fallbackResponse = await fetch('/api/images');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log("[Client] Fetched fallback images:", fallbackData.length);
          setImages(fallbackData);
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };
    
    fetchImages();
  }, []);
  
  // Filter images when searchTerm or images change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredImages(images);
      return;
    }
    
    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = images.filter(image => 
      (image.name && image.name.toLowerCase().includes(lowercaseSearch)) || 
      (image.extracted_text && image.extracted_text.toLowerCase().includes(lowercaseSearch))
    );
    
    setFilteredImages(filtered);
  }, [searchTerm, images]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Enable server-side search by updating the URL
    // This will trigger a server refetch with the search parameter
    router.push(`/?search=${encodeURIComponent(searchTerm)}`);
  };
  
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Belum ada gambar yang diunggah
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari gambar berdasarkan nama atau konten..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" variant="secondary">Cari</Button>
      </form>
      
      <div className="overflow-x-auto">
        <div className="overflow-y-auto max-h-[calc(100vh-300px)] min-h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[60px]">No</TableHead>
                <TableHead className="w-[200px]">Nama Gambar</TableHead>
                <TableHead className="w-[200px]">Lokasi File</TableHead>
                <TableHead>Pratinjau Teks</TableHead>
                <TableHead className="w-[120px]">Tanggal Ditambahkan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredImages.map((image: any, index: number) => (
                <TableRow key={image.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/?id=${image.id}`)}>
                  <TableCell className="text-center font-medium">{index + 1}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <Link href={`/?id=${image.id}`} className="hover:underline font-medium" title={image.name} onClick={(e) => e.stopPropagation()}>
                      {image.name}
                    </Link>
                  </TableCell>
                  <TableCell 
                    className="text-xs text-muted-foreground truncate max-w-[200px]" 
                    title={image.image_path}
                  >
                    {image.image_path}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={image.extracted_text || "Tidak ada teks yang diekstrak"}>
                    {image.extracted_text
                      ? `${image.extracted_text.substring(0, 50)}${image.extracted_text.length > 50 ? "..." : ""}`
                      : "Tidak ada teks yang diekstrak"}
                  </TableCell>
                  <TableCell>{formatDate(image.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {filteredImages.length === 0 && searchTerm && (
        <div className="text-center py-4 text-muted-foreground">
          Tidak ditemukan gambar yang cocok dengan "{searchTerm}"
        </div>
      )}
    </div>
  );
} 