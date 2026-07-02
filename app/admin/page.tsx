// app/admin/page.tsx
import { addBook } from '@/app/actions/bookActions'
import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const user = await currentUser()
  
  // REPLACE THIS WITH YOUR REAL CLERK EMAIL
  const ADMIN_EMAIL = 'tahausman642@gmail.com'

  const isAuthorized = user?.emailAddresses.some(
    (email) => email.emailAddress === ADMIN_EMAIL
  )

  if (!isAuthorized) {
    redirect('/')
  }

  // 1. Fetch Inventory
  const inventory = await prisma.book.findMany({
    orderBy: { title: 'asc' }
  })

  // 2. Fetch System-Wide Active Loans (Joined with the User table to get emails!)
  const systemActiveLoans = await prisma.borrowRecord.findMany({
    where: { returnDate: null },
    include: {
      book: true,
      user: true, 
    },
    orderBy: { dueDate: 'asc' }
  })

  // 3. Calculate Quick Stats
  const totalBooks = inventory.reduce((sum, book) => sum + book.totalCopies, 0)
  const totalBorrowed = inventory.reduce((sum, book) => sum + (book.totalCopies - book.available), 0)
  const totalOverdue = systemActiveLoans.filter(loan => new Date() > new Date(loan.dueDate)).length

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">Admin Control Center</h1>
        <a href="/" className="text-sm font-medium text-blue-600 hover:underline">← Back to Catalog</a>
      </header>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Inventory</p>
          <p className="text-4xl font-black text-blue-900">{totalBooks}</p>
        </div>
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-sm text-amber-600 font-semibold uppercase tracking-wider mb-1">Currently Borrowed</p>
          <p className="text-4xl font-black text-amber-900">{totalBorrowed}</p>
        </div>
        <div className="p-6 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-sm text-red-600 font-semibold uppercase tracking-wider mb-1">System Overdue</p>
          <p className="text-4xl font-black text-red-900">{totalOverdue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Management */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <section className="bg-gray-100 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Add New Book</h2>
            <form action={addBook} className="flex flex-col gap-3">
              <input type="text" name="title" placeholder="Book Title" required className="p-2 border rounded-md text-sm" />
              <input type="text" name="author" placeholder="Author Name" required className="p-2 border rounded-md text-sm" />
              <input type="text" name="isbn" placeholder="ISBN Number" required className="p-2 border rounded-md text-sm" />
              <input type="number" name="copies" placeholder="Total Copies" required min="1" className="p-2 border rounded-md text-sm" />
              <button type="submit" className="bg-black text-white p-2 rounded-md hover:bg-gray-800 font-medium text-sm mt-2 transition">
                Add to Inventory
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Active Ledger */}
        <div className="lg:col-span-2">
          <section className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Active System Ledger</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="pb-3 font-medium">User Email</th>
                    <th className="pb-3 font-medium">Book Title</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {systemActiveLoans.map(loan => {
                    const isOverdue = new Date() > new Date(loan.dueDate)
                    return (
                      <tr key={loan.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-4 text-gray-800 font-medium">{loan.user.email}</td>
                        <td className="py-4 text-gray-600 truncate max-w-[200px]">{loan.book.title}</td>
                        <td className="py-4 text-gray-600">{new Date(loan.dueDate).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {systemActiveLoans.length === 0 && (
                <p className="text-center text-gray-500 py-8">No active loans in the system.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}