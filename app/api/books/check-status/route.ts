// app/api/books/check-status/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Extract bookId from the query URL parameters
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    if (!bookId) {
      return NextResponse.json({ success: false, error: 'Book ID is required' }, { status: 400 })
    }

    // Check if an active loan exists
    const activeLoan = await prisma.borrowRecord.findFirst({
      where: { userId, bookId, returnDate: null }
    })

    // Return true if a loan was found, false otherwise
    return NextResponse.json({ success: true, hasBorrowed: !!activeLoan })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}