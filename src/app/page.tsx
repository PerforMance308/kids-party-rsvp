'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'loading') {
      setIsAuthenticated(null)
    } else if (status === 'authenticated' && session?.user?.id) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [status, session])

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="section-spacing bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="container mx-auto px-4">
          <div className="mobile-container text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 text-balance">
              Kid Party RSVP
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 mb-8 text-balance max-w-2xl mx-auto">
              Simple, beautiful party invitations and RSVP management for children's parties.
              No logins required for your guests!
            </p>

            {isAuthenticated === null ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto sm:max-w-none">
                <Link href="/dashboard" className="btn btn-primary text-lg px-8">
                  Go to Dashboard
                </Link>
                <Link href="/party/new" className="btn btn-secondary text-lg px-8">
                  Create New Party
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto sm:max-w-none">
                <Link href="/register" className="btn btn-primary text-lg px-8">
                  Start Planning
                </Link>
                <Link href="/login" className="btn btn-secondary text-lg px-8">
                  I Have an Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Built for busy parents who want beautiful, stress-free party planning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="card text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                QR Code Invitations
              </h3>
              <p className="text-neutral-600">
                Generate beautiful QR codes for your paper invitations. Guests just scan and RSVP!
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                No Guest Logins
              </h3>
              <p className="text-neutral-600">
                Your guests never need to create accounts. They just click, fill out the form, and they're done.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                Real-time Dashboard
              </h3>
              <p className="text-neutral-600">
                Track RSVPs in real-time. See who's coming, dietary restrictions, and parent contact info.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                Reuse Contacts
              </h3>
              <p className="text-neutral-600">
                Planning another party? Instantly invite the same group of friends with one click.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                Smart Reminders
              </h3>
              <p className="text-neutral-600">
                Automatic friendly reminders sent 7 days, 2 days, and the morning of your party.
              </p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                Private & Safe
              </h3>
              <p className="text-neutral-600">
                Your parties are completely private. Guests can't see other attendees' information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-primary-600">
        <div className="container mx-auto px-4">
          <div className="mobile-container text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Plan Your Party?
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of parents who've made party planning simple and stress-free.
            </p>
            <a href="/register" className="btn bg-white text-primary-600 hover:bg-neutral-50 text-lg px-8 font-semibold">
              Get Started Free
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}