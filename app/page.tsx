// app/page.tsx
import prisma from '@/lib/prisma'
import { SignInButton, UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import BorrowButton from '@/components/BorrowButton'
import ReturnButton from '@/components/ReturnButton'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ query?: string; availableOnly?: string; page?: string }>
}

export default async function Home({ searchParams }: PageProps) {
  // 1. Await and parse all URL parameters
  const params = await searchParams
  const query = params.query || ''
  const availableOnly = params.availableOnly === 'true'
  const currentPage = Number(params.page) || 1
  const ITEMS_PER_PAGE = 6 // Showing 6 books fits perfectly in a 3-column grid

  // 2. Fetch auth state
  const { userId } = await auth()

  // 3. Define the query filter (reusable for both findMany and count)
  // Note: mode: 'insensitive' is critical for PostgreSQL searches!
  const whereClause = {
    AND: [
      {
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { author: { contains: query, mode: 'insensitive' as const } },
        ],
      },
      availableOnly ? { available: { gte: 1 } } : {},
    ],
  }

  // 4. Fetch data and total count simultaneously
  const [books, totalBooks] = await Promise.all([
    prisma.book.findMany({
      where: whereClause,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: { title: 'asc' },
    }),
    prisma.book.count({
      where: whereClause,
    })
  ])

  const totalPages = Math.ceil(totalBooks / ITEMS_PER_PAGE)

  // Helper function to generate pagination URLs that preserve filters
  const getPageUrl = (page: number) => {
    const urlParams = new URLSearchParams()
    if (query) urlParams.set('query', query)
    if (availableOnly) urlParams.set('availableOnly', 'true')
    urlParams.set('page', page.toString())
    return `/?${urlParams.toString()}`
  }

  // 5. Fetch user loans
  let activeLoans: { id: string; bookId: string }[] = []
  if (userId) {
    activeLoans = await prisma.borrowRecord.findMany({
      where: { userId: userId, returnDate: null },
      select: { id: true, bookId: true }
    })
  }

  return (
    <div className="max-w-5xl mx-auto p-8 font-sans">
      {/* Navigation & Auth Header */}
      <header className="flex justify-between items-center mb-12 border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Library Portal</h1>
        <nav>
          {!userId ? (
            <div className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition">
              <SignInButton mode="modal" />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black">
                My Dashboard
              </a>
              <a href="/admin" className="text-sm font-medium text-gray-600 hover:text-black">
                Admin Panel
              </a>
              <UserButton />
            </div>
          )}
        </nav>
      </header>

      {/* Search and Filter Control Bar */}
      <div className="mb-8 bg-gray-50 p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center justify-between">
        <form method="GET" action="/" className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search by title or author..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
          />

          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium select-none">
            <input
              type="checkbox"
              name="availableOnly"
              value="true"
              defaultChecked={availableOnly}
              className="rounded border-gray-300 text-black focus:ring-black h-4 w-4"
            />
            Available Only
          </label>

          <button type="submit" className="bg-black text-white px-5 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition">
            Filter
          </button>
        </form>

        {(query || availableOnly) && (
          <a href="/" className="text-xs font-semibold text-gray-500 hover:text-black underline shrink-0">
            Clear Filters
          </a>
        )}
      </div>

      {/* Book Catalog Grid */}
      <main>
        <h2 className="text-2xl font-semibold mb-6">Browse Collection</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {books.map((book) => {
            const userActiveLoan = activeLoans.find((loan) => loan.bookId === book.id)

            return (
              <div key={book.id} className="border rounded-lg p-5 shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between">
                <div className="mb-4">
                  <a href={`/book/${book.id}`} className="hover:underline hover:text-blue-600 transition">
                    <h3 className="text-xl font-bold mb-1 line-clamp-1">{book.title}</h3>
                  </a>
                  <p className="text-gray-600 mb-2">by {book.author}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${book.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {book.available} / {book.totalCopies} Available
                  </span>
                </div>

                {/* Dynamic Call to Action */}
                <div className="mt-auto pt-4 border-t">
                  {!userId ? (
                    <p className="text-sm text-gray-500 italic">Sign in to borrow</p>
                  ) : userActiveLoan ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-blue-600 font-semibold text-center mb-1">Currently Borrowed</p>
                      <ReturnButton recordId={userActiveLoan.id} />
                    </div>
                  ) : book.available > 0 ? (
                    <BorrowButton bookId={book.id} />
                  ) : (
                    <button disabled className="w-full bg-gray-200 text-gray-500 py-2 rounded-md font-medium cursor-not-allowed">
                      Out of Stock
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {books.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">No books found matching your current filter criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 border-t pt-8">
            <Link 
              href={getPageUrl(currentPage - 1)}
              className={`px-4 py-2 border rounded-md text-sm font-medium ${currentPage <= 1 ? 'pointer-events-none opacity-50 bg-gray-50 text-gray-400' : 'hover:bg-gray-100 text-black'}`}
            >
              ← Previous
            </Link>
            
            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <Link 
              href={getPageUrl(currentPage + 1)}
              className={`px-4 py-2 border rounded-md text-sm font-medium ${currentPage >= totalPages ? 'pointer-events-none opacity-50 bg-gray-50 text-gray-400' : 'hover:bg-gray-100 text-black'}`}
            >
              Next →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}