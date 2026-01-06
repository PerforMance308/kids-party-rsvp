'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function UserNav() {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const isLoading = status === 'loading'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    if (isLoading) {
        return (
            <div className="h-10 w-20 bg-neutral-100 animate-pulse rounded-lg"></div>
        )
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }

    if (session?.user) {
        return (
            <div className="relative">
                <nav className="flex items-center space-x-2 md:space-x-4">
                    {/* Desktop Navigation */}
                    <Link
                        href="/dashboard"
                        className="hidden sm:block px-3 py-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/invitations"
                        className="hidden sm:block px-3 py-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        Invitations
                    </Link>
                    <Link
                        href="/children"
                        className="hidden sm:block px-3 py-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        My Children
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMobileMenu}
                        className="sm:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                        aria-label="Open mobile menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                            />
                        </svg>
                    </button>

                    {/* Always visible buttons */}
                    <Link href="/party/new" className="btn btn-primary text-sm md:text-base">
                        New Party
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="hidden sm:block px-3 py-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors text-sm md:text-base"
                    >
                        Logout
                    </button>
                </nav>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden"
                            onClick={closeMobileMenu}
                        />
                        
                        {/* Mobile Menu */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50 sm:hidden">
                            <Link
                                href="/dashboard"
                                onClick={closeMobileMenu}
                                className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/invitations"
                                onClick={closeMobileMenu}
                                className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                                Invitations
                            </Link>
                            <Link
                                href="/children"
                                onClick={closeMobileMenu}
                                className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                                My Children
                            </Link>
                            <hr className="my-2 border-neutral-200" />
                            <button
                                onClick={() => {
                                    closeMobileMenu()
                                    signOut({ callbackUrl: '/' })
                                }}
                                className="block w-full text-left px-4 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </>
                )}
            </div>
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
