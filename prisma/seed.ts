// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Initialize the exact same way we did in lib/prisma.ts
const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db"
})
const prisma = new PrismaClient({ adapter })
async function main() {
  console.log('Seeding database with books...')

  const mockBooks = [
    { title: "The Pragmatic Programmer", author: "David Thomas", isbn: "978-0135957059", totalCopies: 3 },
    { title: "Clean Code", author: "Robert C. Martin", isbn: "978-0132350884", totalCopies: 5 },
    { title: "Dune", author: "Frank Herbert", isbn: "978-0441172719", totalCopies: 2 },
    { title: "Neuromancer", author: "William Gibson", isbn: "978-0441569595", totalCopies: 1 },
    { title: "The Martian", author: "Andy Weir", isbn: "978-0553418026", totalCopies: 4 },
    { title: "System Design Interview", author: "Alex Xu", isbn: "978-1736049112", totalCopies: 6 },
    { title: "1984", author: "George Orwell", isbn: "978-0451524935", totalCopies: 3 },
    { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0060935467", totalCopies: 4 }
  ]

  for (const book of mockBooks) {
    // We use upsert so you can run this script multiple times safely 
    // without throwing "Unique constraint failed" errors on the ISBN.
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {}, 
      create: {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        totalCopies: book.totalCopies,
        available: book.totalCopies, // Freshly seeded books are fully available
      },
    })
  }

  console.log('Database seeded successfully! 🌱')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })