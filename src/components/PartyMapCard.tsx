'use client'

interface PartyMapCardProps {
  address?: string | null
  title?: string
}

export default function PartyMapCard({ address, title = 'Party Location Map' }: PartyMapCardProps) {
  if (!address) return null

  const encoded = encodeURIComponent(address)
  const embedUrl = `https://www.google.com/maps?q=${encoded}&output=embed`
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-primary-700 hover:text-primary-800"
        >
          Open in Maps
        </a>
      </div>
      <iframe
        title={title}
        src={embedUrl}
        className="w-full h-64 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
