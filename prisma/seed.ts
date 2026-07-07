// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Insert dummy books
  const books = await prisma.book.createMany({
    data: [
      { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '978-0135957059', totalCopies: 5, available: 5 },
      { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', totalCopies: 3, available: 3 },
      { title: 'Design Patterns', author: 'Erich Gamma', isbn: '978-0201633610', totalCopies: 4, available: 4 },
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', totalCopies: 2, available: 2 },
      { title: 'You Don\'t Know JS', author: 'Kyle Simpson', isbn: '978-1491904244', totalCopies: 6, available: 6 },
      { title: 'System Design Interview', author: 'Alex Xu', isbn: '978-1736049112', totalCopies: 8, available: 8 },
      { title: 'The Rust Programming Language', author: 'Steve Klabnik', isbn: '978-1593278281', totalCopies: 3, available: 3 },
      { title: 'Grokking Algorithms', author: 'Aditya Bhargava', isbn: '978-1617292231', totalCopies: 5, available: 5 }
    ],
    skipDuplicates: true, // Prevents errors if you run the seed command twice
  })

  console.log(`✅ Successfully added ${books.count} books to the catalog.`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })