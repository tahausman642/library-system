// app/api/books/my-books/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Find all active loans for this user and include the book details
    const activeLoans = await prisma.borrowRecord.findMany({
      where: { 
        userId: userId, 
        returnDate: null 
      },
      include: { 
        book: true // This tells Prisma to fetch the joined Book data
      },
      orderBy: {
        dueDate: 'asc' // Show closest due dates first
      }
    })

    return NextResponse.json({ success: true, data: activeLoans })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}