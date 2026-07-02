// app/actions/returnActions.ts
'use server'

import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function returnBook(formData: FormData) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error("You must be logged in to return a book.")
  }

  const recordId = formData.get('recordId') as string

  // Run a transaction to safely return the book
  await prisma.$transaction(async (tx) => {
    // 1. Find the active borrow record
    const record = await tx.borrowRecord.findUnique({
      where: { id: recordId }
    })

    // FIXED: Using returnDate instead of returnedAt
    if (!record || record.returnDate) {
      throw new Error("Record not found or book already returned.")
    }

    // 2. Mark the record as returned
    await tx.borrowRecord.update({
      where: { id: recordId },
      data: { returnDate: new Date() } // FIXED
    })

    // 3. Increment the available book inventory count
    await tx.book.update({
      where: { id: record.bookId },
      data: { available: { increment: 1 } }
    })
  })

  // Instantly refresh the dashboard and catalog views
  revalidatePath('/dashboard')
  revalidatePath('/')
}