// app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const user = await currentUser()
    
    // Use the exact same email check from your web app
    const ADMIN_EMAIL = 'tahausman642@gmail.com'
    const isAuthorized = user?.emailAddresses.some(
      (email) => email.emailAddress === ADMIN_EMAIL
    )

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized Access' }, { status: 403 })
    }

    // 1. Fetch Inventory & Loans
    const inventory = await prisma.book.findMany()
    const systemActiveLoans = await prisma.borrowRecord.findMany({
      where: { returnDate: null },
      include: {
        book: true,
        user: true,
      },
      orderBy: { dueDate: 'asc' }
    })

    // 2. Calculate Stats
    const totalBooks = inventory.reduce((sum, book) => sum + book.totalCopies, 0)
    const totalBorrowed = inventory.reduce((sum, book) => sum + (book.totalCopies - book.available), 0)
    const totalOverdue = systemActiveLoans.filter(loan => new Date() > new Date(loan.dueDate)).length

    return NextResponse.json({
      success: true,
      data: {
        stats: { totalBooks, totalBorrowed, totalOverdue },
        activeLoans: systemActiveLoans,
        inventory: inventory,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}