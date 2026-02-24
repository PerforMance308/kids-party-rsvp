'use client'

import { useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'

// Minimal type declarations for Google Places Autocomplete
interface GPlaceResult {
  formatted_address?: string
  name?: string
  place_id?: string
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

interface GAutocomplete {
  addListener: (event: string, handler: () => void) => void
  getPlace: () => GPlaceResult
}

type AutocompleteType = 'address' | 'city' | 'all'

export interface AddressSelection {
  displayAddress: string
  fullAddress: string
  placeId?: string
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: { types?: string[]; fields?: string[]; language?: string }
          ) => GAutocomplete
        }
      }
    }
    __googleMapsPlacesReady?: () => void
  }
}

interface AddressAutocompleteProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  /** BCP-47 locale tag forwarded to the Places API for localised suggestions */
  locale?: string
  /** Which place types to suggest. Defaults to detailed addresses. */
  autocompleteType?: AutocompleteType
  /**
   * Called only when a suggestion is selected.
   * `displayAddress` is city-level and should be used for visible location text.
   * `fullAddress` is detailed and can be stored for map usage.
   */
  onSelect?: (selection: AddressSelection) => void
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export default function AddressAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  className = 'input',
  required,
  locale = 'en',
  autocompleteType = 'address',
  onSelect,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<GAutocomplete | null>(null)

  // Sync parent-driven value changes into the DOM input (e.g. form reset),
  // but only when the field is not currently focused to avoid disrupting typing.
  useEffect(() => {
    const el = inputRef.current
    if (el && document.activeElement !== el && el.value !== value) {
      el.value = value
    }
  }, [value])

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current) return
    if (autocompleteRef.current) return // already initialised
    if (!window.google?.maps?.places?.Autocomplete) return

    const types =
      autocompleteType === 'city'
        ? ['(cities)']
        : autocompleteType === 'address'
          ? ['address']
          : undefined

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types,
      fields: ['formatted_address', 'name', 'place_id', 'address_components'],
    })

    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      const selectedFull = place.formatted_address || place.name || ''
      if (selectedFull && inputRef.current) {
        const cityLevel = formatCityLevelAddress(place, selectedFull)
        inputRef.current.value = cityLevel
        onChange(cityLevel)
        onSelect?.({
          displayAddress: cityLevel,
          fullAddress: selectedFull,
          placeId: place.place_id,
        })
      }
    })

    autocompleteRef.current = ac
  }, [autocompleteType, onChange, onSelect])

  // Initialise once the Maps script has loaded (or immediately if it's already present)
  useEffect(() => {
    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }
    // Register a one-time callback invoked by the script's `callback` param
    window.__googleMapsPlacesReady = () => {
      initAutocomplete()
      delete window.__googleMapsPlacesReady
    }
  }, [initAutocomplete])

  // No API key -> plain input with no autocomplete
  if (!API_KEY) {
    return (
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        required={required}
      />
    )
  }

  return (
    <>
      {/*
        Load the Places API once globally. `callback=__googleMapsPlacesReady`
        fires our init function as soon as the script is ready.
        `loading=async` is recommended by Google to avoid blocking the page.
      */}
      <Script
        id="google-maps-places"
        src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=${locale}&loading=async&callback=__googleMapsPlacesReady`}
        strategy="lazyOnload"
      />

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          // defaultValue seeds the uncontrolled DOM input; parent-driven changes
          // are synced via the useEffect above.
          defaultValue={value}
          // Keep parent state in sync as the user types (no autocomplete selected)
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          required={required}
          autoComplete="off"
        />
      </div>
    </>
  )
}

function formatCityLevelAddress(place: GPlaceResult, fallback: string): string {
  const components = place.address_components || []
  const get = (type: string, key: 'long_name' | 'short_name' = 'long_name') =>
    components.find((c) => c.types.includes(type))?.[key]

  const streetNumber = get('street_number')
  const route = get('route')
  const locality =
    get('locality') ||
    get('postal_town') ||
    get('administrative_area_level_3') ||
    get('sublocality')
  const admin1 = get('administrative_area_level_1', 'short_name')

  const street = [streetNumber, route].filter(Boolean).join(' ')

  // Prefer "street + city" display (your requested format), with state as fallback.
  if (street && locality) return `${street}, ${locality}`
  if (street && admin1) return `${street}, ${admin1}`
  if (street) return street
  if (locality && admin1) return `${locality}, ${admin1}`
  if (locality) return locality
  if (place.name) return place.name
  return fallback
}
