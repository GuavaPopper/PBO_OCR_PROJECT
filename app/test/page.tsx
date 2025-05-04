import { getImages } from "../actions"

export default async function TestPage() {
  const images = await getImages()
  
  console.log("[Test] Images fetched:", images && images.length)
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Test Page - Direct Image Data</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-bold">Found {images ? images.length : 'null'} images</h2>
      </div>
      
      <div className="border p-4 mb-4 rounded">
        <h3 className="font-bold mb-2">Images Data (Raw JSON):</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px]">
          {JSON.stringify(images, null, 2)}
        </pre>
      </div>
      
      {images && images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image: any) => (
            <div key={image.id} className="border p-4 rounded">
              <h3 className="font-bold">{image.name}</h3>
              <p>ID: {image.id}</p>
              <p>Path: {image.image_path}</p>
              <div className="mt-2 h-48 relative">
                {image.image_path && (
                  <img 
                    src={image.image_path.startsWith('/') ? image.image_path : `/${image.image_path}`}
                    alt={image.name}
                    style={{ maxHeight: "100%", margin: "0 auto" }}
                  />
                )}
              </div>
              <div className="mt-2">
                <h4 className="font-bold">Text:</h4>
                <p className="text-sm">{image.extracted_text ? `${image.extracted_text.substring(0, 100)}...` : 'No text'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 border rounded text-center">
          No images found
        </div>
      )}
    </div>
  )
} 