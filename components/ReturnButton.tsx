'use client'

import { useTransition } from 'react'
import { returnBook } from '@/app/actions/returnActions'
import { toast } from 'sonner'

export default function ReturnButton({ recordId }: { recordId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleReturn = async () => {
        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.append('recordId', recordId)
                await returnBook(formData)
                toast.success('Book returned successfully!')
            } catch (error: any) {
                toast.error(error.message || 'Failed to return the book.')
            }
        })
    }

    return (
        <button
            onClick={handleReturn}
            disabled={isPending}
            className={"w-full sm:w-auto bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 px-4 py-2 rounded-md font-medium text-sm transition border disabled:opacity-50"}
        >
            {isPending ? 'Returning...' : 'Return Book'} </button>
    )
}