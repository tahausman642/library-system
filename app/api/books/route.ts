// app/api/books/route.ts
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

// This handles standard GET requests to /api/books
export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: { title: 'asc' },
      // Optional: Don't send sensitive or unnecessary data to the mobile app
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        available: true,
        totalCopies: true,
      }
    })

    return NextResponse.json({ success: true, data: books })
  } catch (error) {
    console.error("Failed to fetch books for API:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch books" }, 
      { status: 500 }
    )
  }
}