// app/book/page.tsx
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import BorrowButton from '@/components/BorrowButton'
import ReturnButton from '@/components/ReturnButton'

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function BookDetailsPage({ searchParams }: PageProps) {
  // Get the ID from the query string instead of the path
  const params = await searchParams
  const bookId = params.id

  if (!bookId) notFound()

  const book = await prisma.book.findUnique({
    where: { id: bookId }
  })

  if (!book) notFound()

  const { userId } = await auth()
  
  let userActiveLoan = null
  if (userId) {
    userActiveLoan = await prisma.borrowRecord.findFirst({
      where: { userId: userId, bookId: book.id, returnDate: null }
    })
  }

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-4xl font-bold">{book.title}</h1>
      <p className="text-gray-600 mb-6">by {book.author}</p>
      
      {/* Action buttons here... */}
      {book.available > 0 ? (
        <BorrowButton bookId={book.id} />
      ) : (
        <p className="text-red-600">Out of Stock</p>
      )}
    </div>
  )
}