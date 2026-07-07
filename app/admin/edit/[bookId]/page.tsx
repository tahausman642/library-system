import { updateBook, deleteBook } from '@/app/actions/bookActions'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

export default async function EditBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params
  const book = await prisma.book.findUnique({ where: { id: bookId } })

  if (!book) notFound()

  // Use a bound server action: the ID is pre-filled
  const updateBookWithId = updateBook.bind(null, book.id)

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Book: {book.title}</h1>
      
      <form action={updateBookWithId} className="space-y-4">
        <input name="title" defaultValue={book.title} className="w-full border p-2" required />
        <input name="author" defaultValue={book.author} className="w-full border p-2" required />
        <input name="isbn" defaultValue={book.isbn} className="w-full border p-2" />
        <input name="copies" type="number" defaultValue={book.totalCopies} className="w-full border p-2" />
        
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">Update Book</button>
      </form>

      <form action={async () => { "use server"; await deleteBook(book.id); redirect('/admin') }}>
        <button type="submit" className="bg-red-600 text-white px-4 py-2 mt-4">Delete Book</button>
      </form>
    </div>
  )
}