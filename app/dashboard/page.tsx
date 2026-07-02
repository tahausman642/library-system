// app/dashboard/page.tsx
import prisma from '@/lib/prisma'
import { returnBook } from '@/app/actions/returnActions'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function UserDashboard() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  // 1. Fetch active loans (books they currently have)
  const activeLoans = await prisma.borrowRecord.findMany({
    where: {
      userId: userId,
      returnDate: null, 
    },
    include: { book: true },
    orderBy: { dueDate: 'asc' },
  })

  // 2. Fetch borrowing history (books they have returned)
  const pastLoans = await prisma.borrowRecord.findMany({
    where: {
      userId: userId,
      returnDate: { not: null }, // Only fetch records with a return date
    },
    include: { book: true },
    orderBy: { returnDate: 'desc' }, // Show most recently returned first
  })

  // 3. Calculate if they have any overdue books right now
  const overdueCount = activeLoans.filter((loan) => new Date() > new Date(loan.dueDate)).length

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-gray-500 text-sm">Manage your borrowed books and history</p>
        </div>
        <a href="/" className="text-sm font-medium text-blue-600 hover:underline">
          ← Back to Catalog
        </a>
      </header>

      {/* Due Date Warning Banner */}
      {overdueCount > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">
            You have {overdueCount} {overdueCount === 1 ? 'book' : 'books'} past due. Please return {overdueCount === 1 ? 'it' : 'them'} immediately.
          </p>
        </div>
      )}

      <main className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Active Loans */}
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Currently Borrowed</h2>
          <div className="flex flex-col gap-4">
            {activeLoans.map((loan) => {
              const isOverdue = new Date() > new Date(loan.dueDate)
              
              return (
                <div key={loan.id} className={`border rounded-lg p-4 bg-white shadow-sm ${isOverdue ? 'border-red-300' : ''}`}>
                  <h3 className="text-lg font-bold">{loan.book.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">by {loan.book.author}</p>
                  <p className={`text-xs font-semibold mb-4 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                    Due: {new Date(loan.dueDate).toLocaleDateString()} {isOverdue && '(OVERDUE)'}
                  </p>

                  <form action={returnBook}>
                    <input type="hidden" name="recordId" value={loan.id} />
                    <button 
                      type="submit"
                      className="w-full bg-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 py-2 rounded-md font-medium text-sm transition border"
                    >
                      Return Book
                    </button>
                  </form>
                </div>
              )
            })}

            {activeLoans.length === 0 && (
              <p className="text-gray-500 text-sm italic">No active borrowed books.</p>
            )}
          </div>
        </section>

        {/* Right Column: History Log */}
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Reading History</h2>
          <div className="flex flex-col gap-3">
            {pastLoans.map((loan) => (
              <div key={loan.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <h3 className="text-md font-bold text-gray-700">{loan.book.title}</h3>
                <p className="text-gray-500 text-xs">
                  Returned on {new Date(loan.returnDate!).toLocaleDateString()}
                </p>
              </div>
            ))}

            {pastLoans.length === 0 && (
              <p className="text-gray-400 text-sm italic">Your reading history is empty.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}