'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function UserNav() {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const isLoading = status === 'loading'

    if (isLoading) {
        return (
            <div className="h-10 w-20 bg-neutral-100 animate-pulse rounded-lg"></div>
        )
    }

    if (session?.user) {
        return (
            <nav className="flex items-center space-x-2 md:space-x-4">
                <Link
                    href="/dashboard"
                    className="hidden sm:block px-3 py-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                    Dashboard
                </Link>
                <Link href="/party/new" className="btn btn-primary text-sm md:text-base">
                    New Party
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-3 py-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors text-sm md:text-base"
                >
                    Logout
                </button>
            </nav>
        )
    }



    return (
        <nav className="flex items-center space-x-2 md:space-x-4">
            <Link
                href={`/login?redirect=${encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))}`}
                className="px-3 py-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors text-sm md:text-base"
            >
                Login
            </Link>
            <Link href="/register" className="btn btn-primary text-sm md:text-base">
                Sign Up
            </Link>
        </nav>
    )
}
