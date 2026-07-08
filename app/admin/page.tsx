// app/admin/page.tsx
import { addBook } from '@/app/actions/bookActions'
import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default async function AdminDashboard() {
  const user = await currentUser()
  const ADMIN_EMAIL = 'tahausman642@gmail.com'
  const isAuthorized = user?.emailAddresses.some((email) => email.emailAddress === ADMIN_EMAIL)

  if (!isAuthorized) redirect('/')

  const inventory = await prisma.book.findMany({ orderBy: { title: 'asc' } })
  const systemActiveLoans = await prisma.borrowRecord.findMany({
    where: { returnDate: null },
    include: { book: true, user: true },
    orderBy: { dueDate: 'asc' }
  })

  const totalBooks = inventory.reduce((sum, book) => sum + book.totalCopies, 0)
  const totalBorrowed = inventory.reduce((sum, book) => sum + (book.totalCopies - book.available), 0)
  const totalOverdue = systemActiveLoans.filter(loan => new Date() > new Date(loan.dueDate)).length

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
      <header className="flex justify-between items-center mb-8 border-b dark:border-gray-800 pb-4">
        <h1 className="text-3xl font-bold">Admin Control Center</h1>
        <div className="flex items-center gap-4">
          <a href="/" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">← Back to Catalog</a>
          <ThemeToggle />
        </div>
      </header>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">Total Inventory</p>
          <p className="text-4xl font-black text-blue-900 dark:text-blue-100">{totalBooks}</p>
        </div>
        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
          <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider mb-1">Currently Borrowed</p>
          <p className="text-4xl font-black text-amber-900 dark:text-amber-100">{totalBorrowed}</p>
        </div>
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider mb-1">System Overdue</p>
          <p className="text-4xl font-black text-red-900 dark:text-red-100">{totalOverdue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <section className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Add New Book</h2>
            <form action={addBook} className="flex flex-col gap-3">
              <input type="text" name="title" placeholder="Book Title" required className="p-2 border dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900" />
              <input type="text" name="author" placeholder="Author Name" required className="p-2 border dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900" />
              <input type="text" name="isbn" placeholder="ISBN Number" required className="p-2 border dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900" />
              <input type="number" name="copies" placeholder="Total Copies" required min="1" className="p-2 border dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-900" />
              <button type="submit" className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-md hover:bg-gray-800 font-medium text-sm mt-2 transition">
                Add to Inventory
              </button>
            </form>
          </section>
        </div>

        <div className="lg:col-span-2">
          {/* Active Ledger Section */}
          <section className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Active System Ledger</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
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
                    <tr key={loan.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4 text-gray-800 dark:text-gray-200 font-medium">{loan.user.email}</td>
                      <td className="py-4 text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{loan.book.title}</td>
                      <td className="py-4 text-gray-600 dark:text-gray-400">{new Date(loan.dueDate).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* Manage Inventory Section */}
          <section className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Manage Inventory</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Copies</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((book) => (
                  <tr key={book.id} className="border-b dark:border-gray-800 text-gray-800 dark:text-gray-200">
                    <td className="py-3">{book.title}</td>
                    <td className="py-3">{book.available} / {book.totalCopies}</td>
                    <td className="py-3">
                      <a href={`/admin/edit/${book.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">Edit</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  )
}