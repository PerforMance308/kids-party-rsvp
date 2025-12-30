'use client'

import { useState, useEffect } from 'react'

interface Contact {
  id: string
  parentName: string
  childName: string
  email: string
  phone?: string
}

interface ContactReuseProps {
  onContactsSelected: (contacts: Contact[]) => void
}

export default function ContactReuse({ onContactsSelected }: ContactReuseProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [showContacts, setShowContacts] = useState(false)

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/contacts')
        if (response.ok) {
          const data = await response.json()
          setContacts(data)
          if (data.length > 0) {
            setShowContacts(true)
          }
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [])

  const handleContactToggle = (contactId: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)

    const selectedContactsList = contacts.filter(contact => newSelected.has(contact.id))
    onContactsSelected(selectedContactsList)
  }

  const selectAll = () => {
    const allIds = new Set(contacts.map(c => c.id))
    setSelectedContacts(allIds)
    onContactsSelected(contacts)
  }

  const selectNone = () => {
    setSelectedContacts(new Set())
    onContactsSelected([])
  }

  if (isLoading || contacts.length === 0) {
    return null
  }

  if (!showContacts) {
    return (
      <div className="card mb-6">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">
            Do you have contacts from previous parties you'd like to invite?
          </p>
          <button
            onClick={() => setShowContacts(true)}
            className="btn btn-secondary"
          >
            Browse Previous Contacts ({contacts.length})
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">
          Reuse Previous Contacts
        </h3>
        <div className="space-x-2">
          <button
            onClick={selectAll}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Select All
          </button>
          <button
            onClick={selectNone}
            className="text-sm text-neutral-600 hover:text-neutral-700"
          >
            Select None
          </button>
          <button
            onClick={() => setShowContacts(false)}
            className="text-sm text-neutral-600 hover:text-neutral-700"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
        {contacts.map((contact) => (
          <label
            key={contact.id}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedContacts.has(contact.id)
                ? 'border-primary-300 bg-primary-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedContacts.has(contact.id)}
              onChange={() => handleContactToggle(contact.id)}
              className="mr-3"
            />
            <div className="flex-1">
              {contact.childName ? (
                <>
                  <div className="font-medium text-neutral-900">{contact.childName}</div>
                  <div className="text-sm text-neutral-600">Parent: {contact.parentName}</div>
                </>
              ) : (
                <>
                  <div className="font-medium text-neutral-900">{contact.parentName}</div>
                  <div className="text-sm text-neutral-600">No child name recorded</div>
                </>
              )}
              <div className="text-sm text-neutral-500">{contact.email}</div>
              {contact.phone && (
                <div className="text-sm text-neutral-500">{contact.phone}</div>
              )}
            </div>
          </label>
        ))}
      </div>

      {selectedContacts.size > 0 && (
        <div className="mt-4 p-3 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-800">
            {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  )
}