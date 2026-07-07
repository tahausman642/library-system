// app/book/[bookId]/page.tsx
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import BorrowButton from '@/components/BorrowButton'
import ReturnButton from '@/components/ReturnButton'

interface PageProps {
  params: Promise<{ bookId: string }>
}

export default async function BookDetailsPage({ params }: { params: PageProps['params'] }) {
  const { bookId } = await params
  
  const book = await prisma.book.findUnique({ 
    where: { id: bookId } 
  })

  if (!book) notFound()

  const { userId } = await auth()
  
  // Check if the current user has an active loan for this specific book
  const activeLoan = userId 
    ? await prisma.borrowRecord.findFirst({ 
        where: { userId, bookId: book.id, returnDate: null } 
      })
    : null

  return (
    <main className="max-w-2xl mx-auto p-6 md:p-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-sm text-gray-500 mb-2">Library Catalog</div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{book.title}</h1>
        <p className="text-xl text-gray-600 mb-8 italic">by {book.author}</p>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl mb-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">ISBN</p>
            <p className="font-mono text-gray-700">{book.isbn}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Availability</p>
            <p className={`font-bold ${book.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {book.available} / {book.totalCopies} copies
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          {activeLoan ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                You have this book checked out
              </span>
              <ReturnButton recordId={activeLoan.id} />
            </div>
          ) : book.available > 0 ? (
            <div className="w-full">
              <BorrowButton bookId={book.id} />
            </div>
          ) : (
            <div className="text-center py-4 bg-red-50 rounded-lg text-red-700 font-medium">
              Currently Unavailable
            </div>
          )}
        </div>
      </div>
    </main>
  )
}