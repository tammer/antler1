import { useEffect, useMemo, useRef, useState } from 'react'
import './MeetgeekManager.css'
import peopleData from '../data/people.json'

function Notes() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHubspotIds, setSelectedHubspotIds] = useState([])
  const comboboxRef = useRef(null)
  const inputRef = useRef(null)

  const people = peopleData

  const selectedPeople = useMemo(() => {
    const selectedSet = new Set(selectedHubspotIds)
    return people.filter((p) => selectedSet.has(p.hubspot_id))
  }, [people, selectedHubspotIds])

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) => {
      const haystack = `${p.name} ${p.email}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [people, query])

  const togglePerson = (hubspotId) => {
    setSelectedHubspotIds((prev) => {
      if (prev.includes(hubspotId)) {
        return prev.filter((id) => id !== hubspotId)
      }
      return [...prev, hubspotId]
    })
    setQuery('')
    setIsOpen(false)
    queueMicrotask(() => inputRef.current?.blur())
  }

  const removePerson = (hubspotId) => {
    setSelectedHubspotIds((prev) => prev.filter((id) => id !== hubspotId))
  }

  const clearAll = () => {
    setSelectedHubspotIds([])
    setQuery('')
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="meetgeek-manager">
      <h1 className="page-title">
        <span>Notes</span>
      </h1>

      <div className="gemini-form">
        <div className="form-group notes-people-group">
          <label htmlFor="notes-people-input">People</label>

          {selectedPeople.length > 0 && (
            <div className="notes-selected-people">
              {selectedPeople.map((p) => (
                <button
                  key={p.hubspot_id}
                  type="button"
                  className="notes-person-chip"
                  onClick={() => removePerson(p.hubspot_id)}
                  title="Remove"
                >
                  <span className="notes-person-chip-name">{p.name}</span>
                  <span className="notes-person-chip-remove">×</span>
                </button>
              ))}
            </div>
          )}

          <div ref={comboboxRef} className="combobox-container notes-combobox">
            <div className="combobox-input-wrapper">
              <input
                id="notes-people-input"
                type="text"
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Type to search people..."
                autoComplete="off"
                aria-label="Search and select people"
              />
              {(query || selectedHubspotIds.length > 0) && (
                <button
                  type="button"
                  className="clear-button"
                  onClick={clearAll}
                  aria-label="Clear people selection"
                >
                  ×
                </button>
              )}
            </div>

            {isOpen && (
              <ul className="combobox-dropdown notes-people-dropdown">
                {filteredPeople.length === 0 ? (
                  <li className="no-results">No people found</li>
                ) : (
                  filteredPeople.map((p) => {
                    const isSelected = selectedHubspotIds.includes(p.hubspot_id)
                    return (
                      <li
                        key={p.hubspot_id}
                        className={isSelected ? 'selected' : ''}
                        onClick={() => togglePerson(p.hubspot_id)}
                      >
                        <div className="notes-person-option">
                          <span className="notes-person-option-main">
                            <span className="notes-person-option-name">{p.name}</span>
                            <span className="notes-person-option-email">{p.email}</span>
                          </span>
                          <span className="notes-person-option-check" aria-hidden="true">
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                      </li>
                    )
                  })
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notes

