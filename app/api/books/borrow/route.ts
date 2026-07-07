// app/api/books/borrow/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server' // Changed to get full user data

export async function POST(request: Request) {
  try {
    // 1. Get the full Clerk user object so we have access to their email
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = clerkUser.id
    const email = clerkUser.emailAddresses[0]?.emailAddress

    if (!email) {
      return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 })
    }

    // 2. Parse the incoming bookId
    const { bookId } = await request.json()
    if (!bookId) {
      return NextResponse.json({ success: false, error: 'Book ID is required' }, { status: 400 })
    }

    // 3. Run the transaction
    const result = await prisma.$transaction(async (tx) => {
      
      // NEW STEP: Ensure the user exists in our local Postgres database!
      // This prevents the Foreign Key Constraint failure.
      await tx.user.upsert({
        where: { id: userId },
        update: {}, // Do nothing if they already exist
        create: {
          id: userId,
          email: email,
          // role defaults to USER based on your schema
        }
      })

      // Check if the book exists and is available
      const book = await tx.book.findUnique({ where: { id: bookId } })
      if (!book || book.available <= 0) {
        throw new Error('Book is out of stock')
      }

      // Check if this user already has an active loan for this book
      const existingLoan = await tx.borrowRecord.findFirst({
        where: { userId, bookId, returnDate: null }
      })
      if (existingLoan) {
        throw new Error('You have already borrowed this book')
      }

      // Decrement availability
      await tx.book.update({
        where: { id: bookId },
        data: { available: { decrement: 1 } }
      })

      // Calculate due date (14 days from today)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14)

      // Create the borrow record
      const record = await tx.borrowRecord.create({
        data: { 
          userId, 
          bookId,
          dueDate
        }
      })

      return record
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}