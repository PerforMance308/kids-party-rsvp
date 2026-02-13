# Plan: Google Places Autocomplete for Address Input

## Context
Party creation and edit pages have plain text inputs for location/address. User wants autocomplete suggestions when typing an address, using Google Places API.

## Approach
- Vanilla Google Maps JavaScript API via `next/script` (no new npm dependencies)
- Create shared `AddressAutocomplete` component, replace plain inputs in 2 pages
- Graceful degradation: works as plain input if API key is not set

## Files to Create

### `src/components/AddressAutocomplete.tsx`
Reusable client component:
- Props: `value`, `onChange`, `placeholder`, `id`, `required`, `className`
- Uses `next/script` to load Google Maps Places API with `lazyOnload` strategy
- Passes `locale` to script URL for localized results (`&language=${locale}`)
- Initializes `google.maps.places.Autocomplete` on the input ref
- On `place_changed` event → calls `onChange(place.formatted_address)`
- User can also type freely without selecting a suggestion
- If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not set → renders plain `<input>`
- Cleanup: removes listeners on unmount

## Files to Modify

### 1. `src/app/[locale]/party/new/page.tsx` (~line 570-583)
- Import `AddressAutocomplete`
- Replace the location `<input>` block:
```tsx
// BEFORE (lines 574-582):
<input
  type="text"
  id="location"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
  className="input"
  placeholder={t('newParty.locationPlaceholder')}
  required
/>

// AFTER:
<AddressAutocomplete
  id="location"
  value={location}
  onChange={setLocation}
  className="input"
  placeholder={t('newParty.locationPlaceholder')}
  required
/>
```

### 2. `src/app/[locale]/party/[id]/edit/page.tsx` (~line 277-285)
- Import `AddressAutocomplete`
- Replace the location `<input>` block:
```tsx
// BEFORE (lines 277-285):
<input
  type="text"
  id="location"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
  className="input"
  placeholder="e.g., 123 Main St, City, State or Our backyard"
  required
/>

// AFTER:
<AddressAutocomplete
  id="location"
  value={location}
  onChange={setLocation}
  className="input"
  placeholder="e.g., 123 Main St, City, State or Our backyard"
  required
/>
```

### 3. `src/app/globals.css` (append after line 165)
- Add `.pac-container` styles to match project design:
```css
/* Google Places Autocomplete dropdown styling */
.pac-container {
  border-radius: 0.75rem;
  border: 1px solid #e5e5e5;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  margin-top: 4px;
  font-family: inherit;
  z-index: 9999;
}

.pac-item {
  padding: 8px 12px;
  cursor: pointer;
  border-top: 1px solid #f5f5f5;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.pac-item:first-child {
  border-top: none;
}

.pac-item:hover {
  background-color: #faf5ff;
}

.pac-item-selected {
  background-color: #f3e8ff;
}

.pac-icon {
  margin-right: 8px;
}

.pac-item-query {
  font-size: 0.875rem;
  color: #171717;
}
```

### 4. `next.config.js` — No CSP changes needed
The current config does not set a `Content-Security-Policy` header, so Google Maps scripts will load without issues.

## Environment Variable
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```
User needs to enable "Places API" in Google Cloud Console.

## No Database Changes
Location continues to be stored as plain String. No lat/lng for now.

## Verification
1. Without API key → plain text input, no errors
2. With API key → type address → suggestions dropdown appears
3. Select suggestion → populates input
4. Type freely without selecting → works as normal input
5. Party creation saves the address correctly
6. Party edit loads existing address and allows change
7. Works on mobile (touch-friendly dropdown)
