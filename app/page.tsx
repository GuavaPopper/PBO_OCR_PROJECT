import { getImages } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DownloadIcon, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import ClientImagePreview from "@/components/ClientImagePreview"
import ClientImageList from "@/components/ClientImageList"
import Link from "next/link"

// Loading component for the home page
function HomeLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Home page component
export default async function Home({
  searchParams,
}: {
  searchParams: { search?: string; id?: string }
}) {
  // Await the searchParams
  const params = await searchParams;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">OCR Image Processing</h1>
        <div className="flex gap-2">
          <Link href="/" className="flex items-center gap-1">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </Link>
          <Link href="/add">
            <Button size="sm">Add Image</Button>
          </Link>
        </div>
      </div>
      <Suspense fallback={<HomeLoading />}>
        <HomeContent searchParams={params} />
      </Suspense>
    </div>
  )
}

// Content component that fetches data
async function HomeContent({
  searchParams,
}: {
  searchParams: { search?: string; id?: string }
}) {
  console.log("[Server] HomeContent: Starting to fetch images")
  const images = await getImages(searchParams.search)
  console.log("[Server] HomeContent: Images fetched successfully")
  
  // Add detailed debugging
  console.log(`[Server] HomeContent: Received ${images ? images.length : 'null'} images`)
  console.log(`[Server] HomeContent: Images type:`, Array.isArray(images) ? "Array" : typeof images)
  
  if (images && images.length > 0) {
    console.log(`[Server] HomeContent: First image:`, 
                JSON.stringify({
                  id: images[0].id,
                  name: images[0].name,
                  path: images[0].image_path
                }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Image Database</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientImageList initialImages={images} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <ClientImagePreview searchParams={searchParams} images={images} />
      </div>
    </div>
  )
}
