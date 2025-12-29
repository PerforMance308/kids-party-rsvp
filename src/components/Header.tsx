import Link from 'next/link'
import UserNav from './UserNav'

export default function Header() {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="text-xl md:text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            🎉 Kid Party RSVP
          </Link>

          <UserNav />
        </div>
      </div>
    </header>
  )
}