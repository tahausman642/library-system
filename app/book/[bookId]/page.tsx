// app/book/[bookId]/page.tsx
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ bookId: string }>
}

export default async function BookDetailsPage({ params }: PageProps) {
  const { bookId } = await params

  const book = await prisma.book.findUnique({
    where: { id: bookId }
  })

  if (!book) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-4xl font-bold">{book.title}</h1>
      <p className="text-xl text-gray-600">by {book.author}</p>
    </div>
  )
}