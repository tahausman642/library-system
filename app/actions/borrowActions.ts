// app/actions/borrowActions.ts
'use server'

import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function borrowBook(formData: FormData) {
  // Use currentUser() instead of auth() so we can extract their email
  const user = await currentUser()
  
  if (!user) {
    throw new Error("You must be logged in to borrow a book.")
  }

  const bookId = formData.get('bookId') as string

  // Run a database transaction to guarantee data integrity
  await prisma.$transaction(async (tx) => {
    
    // 1. JUST-IN-TIME SYNC: Ensure the Clerk user exists in our local database
    await tx.user.upsert({
      where: { id: user.id },
      update: {}, // If they exist, do nothing
      create: {
        id: user.id,
        email: user.emailAddresses[0].emailAddress,
      }
    })

    // 2. Check if the book exists and is actually available
    const book = await tx.book.findUnique({ where: { id: bookId } })
    
    if (!book || book.available < 1) {
      throw new Error("This book is currently out of stock.")
    }

    // 3. Decrement the available count
    await tx.book.update({
      where: { id: bookId },
      data: { available: book.available - 1 },
    })

    // 4. Create the borrow record (due in 14 days)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)

    await tx.borrowRecord.create({
      data: {
        userId: user.id, 
        bookId: bookId,
        dueDate: dueDate,
      },
    })
  })

  // Refresh the homepage to instantly update the "Available" count
  revalidatePath('/')
  revalidatePath('/dashboard')
}