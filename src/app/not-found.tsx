import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Not Found</h2>
            <p className="text-neutral-600 mb-6">Could not find requested resource</p>
            <Link href="/" className="btn btn-primary">
                Return Home
            </Link>
        </div>
    )
}
