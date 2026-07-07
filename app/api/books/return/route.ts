// app/api/books/return/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  try {
    // 1. Verify user identity
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { bookId } = await request.json()
    if (!bookId) {
      return NextResponse.json({ success: false, error: 'Book ID is required' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 2. Find the active loan (where returnDate is null)
      const activeLoan = await tx.borrowRecord.findFirst({
        where: { userId, bookId, returnDate: null }
      })

      if (!activeLoan) {
        throw new Error('You do not have an active loan for this book')
      }

      // 3. Mark the record as returned with today's date
      const record = await tx.borrowRecord.update({
        where: { id: activeLoan.id },
        data: { returnDate: new Date() }
      })

      // 4. Put the book back on the virtual shelf (+1 to availability)
      await tx.book.update({
        where: { id: bookId },
        data: { available: { increment: 1 } }
      })

      return record
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}