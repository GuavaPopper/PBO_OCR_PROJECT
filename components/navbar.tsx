"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3">
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
      </div>
    </nav>
  )
}
