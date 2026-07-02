// app/actions/bookActions.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addBook(formData: FormData) {
  // Extract data directly from the HTML form
  const title = formData.get('title') as string
  const author = formData.get('author') as string
  const isbn = formData.get('isbn') as string
  const totalCopies = parseInt(formData.get('copies') as string)

  // Insert into SQLite
  await prisma.book.create({
    data: {
      title,
      author,
      isbn,
      totalCopies,
      available: totalCopies, // When added, all copies are available
    },
  })

  // Tell Next.js to instantly clear the cache so the new book appears
  revalidatePath('/admin')
  revalidatePath('/')
}