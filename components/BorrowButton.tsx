'use client'

import { useTransition } from 'react'
import { borrowBook } from '@/app/actions/borrowActions'
import { toast } from 'sonner'

export default function BorrowButton({ bookId }: { bookId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleBorrow = async () => {
        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.append('bookId', bookId)
                await borrowBook(formData)
                toast.success('Book borrowed successfully!')
            } catch (error: any) {
                toast.error(error.message || 'Failed to borrow the book. It might be out of stock.')
            }
        })
    }

    return (
        <button
            onClick={handleBorrow}
            disabled={isPending}
            className={"w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800"}
        >
            {isPending ? 'Processing...' : 'Borrow Book'} </button>
    )
}