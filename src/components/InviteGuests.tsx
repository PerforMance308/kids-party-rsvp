'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/contexts/LanguageContext'

interface Contact {
    id: string
    name: string
    childName?: string
    email: string
}

interface InviteGuestsProps {
    partyId: string
    onInvitesSent?: () => void
}

export default function InviteGuests({ partyId, onInvitesSent }: InviteGuestsProps) {
    const tr = useTranslations('invite')
    const [contacts, setContacts] = useState<Contact[]>([])
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await fetch('/api/contacts')
                if (response.ok) {
                    const data = await response.json()
                    setContacts(data)
                }
            } catch (error) {
                console.error('Failed to fetch contacts:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchContacts()
    }, [])

    const toggleContact = (email: string) => {
        const newSelected = new Set(selectedContacts)
        if (newSelected.has(email)) {
            newSelected.delete(email)
        } else {
            newSelected.add(email)
        }
        setSelectedContacts(newSelected)
    }

    const handleSendInvites = async () => {
        if (selectedContacts.size === 0) return

        setIsSending(true)
        setMessage(null)

        try {
            const response = await fetch(`/api/parties/${partyId}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails: Array.from(selectedContacts),
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setMessage({ type: 'success', text: tr('success').replace('{count}', data.count) })
                setSelectedContacts(new Set())
                if (onInvitesSent) onInvitesSent()
            } else {
                setMessage({ type: 'error', text: tr('error') })
            }
        } catch (error) {
            setMessage({ type: 'error', text: tr('sendError') })
        } finally {
            setIsSending(false)
        }
    }

    if (isLoading) {
        return <div className="text-center py-4 text-neutral-600">{tr('loading')}</div>
    }

    if (contacts.length === 0) {
        return (
            <div className="text-center py-8 text-neutral-600">
                <p>{tr('noContacts')}</p>
                <p className="text-sm mt-2">{tr('noContactsDesc')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-md">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 font-medium text-neutral-700 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedContacts.size === contacts.length && contacts.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedContacts(new Set(contacts.map(c => c.email)))
                                        } else {
                                            setSelectedContacts(new Set())
                                        }
                                    }}
                                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                            </th>
                            <th className="px-4 py-2 font-medium text-neutral-700">{tr('name')}</th>
                            <th className="px-4 py-2 font-medium text-neutral-700">{tr('email')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedContacts.has(contact.email)}
                                        onChange={() => toggleContact(contact.email)}
                                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </td>
                                <td className="px-4 py-2 text-neutral-900">
                                    {contact.name}
                                    {contact.childName && (
                                        <span className="text-neutral-500 text-xs ml-2">
                                            ({tr('child').replace('{name}', contact.childName)})
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-neutral-600">{contact.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-600">
                    {tr('selected').replace('{count}', selectedContacts.size.toString())}
                </div>
                <button
                    onClick={handleSendInvites}
                    disabled={selectedContacts.size === 0 || isSending}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? tr('sending') : tr('send')}
                </button>
            </div>
        </div>
    )
}
