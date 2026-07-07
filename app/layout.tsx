// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      {/* suppressHydrationWarning is required by next-themes */}
      <html lang="en" suppressHydrationWarning>
        <body className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
            {children}
            <Toaster richColors position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}