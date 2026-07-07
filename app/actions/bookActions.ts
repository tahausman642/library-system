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

// Add these to your existing bookActions.ts
export async function updateBook(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const author = formData.get('author') as string
  const isbn = formData.get('isbn') as string
  const totalCopies = parseInt(formData.get('copies') as string)

  await prisma.book.update({
    where: { id },
    data: { 
      title, 
      author, 
      isbn, 
      totalCopies,
      // Optional: Logic to adjust 'available' based on totalCopies change
    }
  })

  revalidatePath(`/admin`)
  revalidatePath(`/book/${id}`)
}

export async function deleteBook(id: string) {
  await prisma.book.delete({ 
    where: { id } 
  })
  revalidatePath('/admin')
}