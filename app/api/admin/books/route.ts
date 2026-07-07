// app/api/admin/books/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

// Helper to check admin authorization
async function isAdmin() {
  const user = await currentUser()
  return user?.emailAddresses.some(
    (email) => email.emailAddress === 'tahausman642@gmail.com'
  )
}

// POST: Add a new book
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

  try {
    const { title, author, isbn, copies } = await request.json()
    const parsedCopies = parseInt(copies)

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        totalCopies: parsedCopies,
        available: parsedCopies, // New books are fully available
      }
    })

    return NextResponse.json({ success: true, data: book })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

// DELETE: Remove a book and its borrow records
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('id')

    if (!bookId) throw new Error('Book ID is required')

    // Delete associated borrow records first (Foreign Key Safety)
    await prisma.borrowRecord.deleteMany({ where: { bookId } })
    // Delete the book
    await prisma.book.delete({ where: { id: bookId } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}