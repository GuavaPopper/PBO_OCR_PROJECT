"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { FormEvent } from "react"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const searchQuery = formData.get("search") as string

    if (searchQuery) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push("/")
    }
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold">
            OCR App
          </Link>
          <div className="hidden md:flex space-x-2">
            <Button variant={pathname === "/" ? "default" : "ghost"} asChild size="sm">
              <Link href="/">Home</Link>
            </Button>
            <Button variant={pathname === "/add" ? "default" : "ghost"} asChild size="sm">
              <Link href="/add">Add</Link>
            </Button>
            <Button variant={pathname === "/edit" ? "default" : "ghost"} asChild size="sm">
              <Link href="/edit">Edit</Link>
            </Button>
            <Button variant={pathname === "/delete" ? "default" : "ghost"} asChild size="sm">
              <Link href="/delete">Delete</Link>
            </Button>
            <Button variant={pathname === "/batch" ? "default" : "ghost"} asChild size="sm">
              <Link href="/batch">Batch</Link>
            </Button>
          </div>
        </div>
        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder="Search images..."
            className="pl-8"
            defaultValue={searchParams.get("search") || ""}
          />
        </form>
      </div>
      <div className="md:hidden border-t">
        <div className="container mx-auto px-4 py-2 flex justify-between">
          <Button variant="ghost" asChild size="sm">
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/add">Add</Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/edit">Edit</Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/delete">Delete</Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/batch">Batch</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
