'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Update the URL with the search term and reset to page 1
    if (searchTerm) {
      router.push(`/?query=${encodeURIComponent(searchTerm)}&page=1`)
    } else {
      router.push(`/`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md mb-8">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search books by title or author..."
        className="flex-1 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <button type="submit" className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition">
        Search
      </button>
    </form>
  )
}