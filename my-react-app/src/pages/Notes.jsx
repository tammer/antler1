import { useEffect, useMemo, useRef, useState } from 'react'
import './MeetgeekManager.css'
import peopleData from '../data/people.json'
import { supabase } from '../lib/supabaseClient'

function PersonSingleSelect({ people, selectedId, onChange, inputId, label }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const comboboxRef = useRef(null)
  const inputRef = useRef(null)

  const selectedPerson = useMemo(() => {
    return people.find((p) => p.hubspot_id === selectedId) ?? null
  }, [people, selectedId])

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) => {
      const haystack = `${p.name} ${p.email}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [people, query])

  const visiblePeople = useMemo(() => filteredPeople.slice(0, 50), [filteredPeople])

  const selectPerson = (hubspotId) => {
    onChange(hubspotId)
    setQuery('')
    setIsOpen(false)
    queueMicrotask(() => inputRef.current?.blur())
  }

  const clearSelection = () => {
    onChange('')
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
    <div className="form-group notes-people-group">
      <label htmlFor={inputId}>{label}</label>

      {selectedPerson && (
        <div className="notes-selected-people">
          <button
            type="button"
            className="notes-person-chip"
            onClick={clearSelection}
            title="Clear selection"
          >
            <span className="notes-person-chip-name">{selectedPerson.name}</span>
            <span className="notes-person-chip-remove">×</span>
          </button>
        </div>
      )}

      <div ref={comboboxRef} className="combobox-container notes-combobox">
        <div className="combobox-input-wrapper">
          <input
            id={inputId}
            type="text"
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={selectedPerson ? 'Type to change person...' : 'Type to search people...'}
            autoComplete="off"
            aria-label="Search and select one person"
          />
          {(query || selectedPerson) && (
            <button
              type="button"
              className="clear-button"
              onClick={clearSelection}
              aria-label="Clear selected person"
            >
              ×
            </button>
          )}
        </div>

        {isOpen && (
          <ul className="combobox-dropdown notes-people-dropdown">
            {visiblePeople.length === 0 ? (
              <li className="no-results">No people found</li>
            ) : (
              visiblePeople.map((p) => {
                const isSelected = selectedId === p.hubspot_id
                return (
                  <li
                    key={p.hubspot_id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => selectPerson(p.hubspot_id)}
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
  )
}

function PeopleMultiSelect({ people, selectedIds, onChange, inputId, label }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const comboboxRef = useRef(null)
  const inputRef = useRef(null)

  const selectedPeople = useMemo(() => {
    const selectedSet = new Set(selectedIds)
    return people.filter((p) => selectedSet.has(p.hubspot_id))
  }, [people, selectedIds])

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) => {
      const haystack = `${p.name} ${p.email}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [people, query])

  const visiblePeople = useMemo(() => filteredPeople.slice(0, 50), [filteredPeople])

  const togglePerson = (hubspotId) => {
    onChange((prev) => {
      if (prev.includes(hubspotId)) {
        return prev.filter((id) => id !== hubspotId)
      }
      return [...prev, hubspotId]
    })

    // UX requested: clear + blur after a selection
    setQuery('')
    setIsOpen(false)
    queueMicrotask(() => inputRef.current?.blur())
  }

  const removePerson = (hubspotId) => {
    onChange((prev) => prev.filter((id) => id !== hubspotId))
  }

  const clearAll = () => {
    onChange([])
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
    <div className="form-group notes-people-group">
      <label htmlFor={inputId}>{label}</label>

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
            id={inputId}
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
          {(query || selectedIds.length > 0) && (
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
            {visiblePeople.length === 0 ? (
              <li className="no-results">No people found</li>
            ) : (
              visiblePeople.map((p) => {
                const isSelected = selectedIds.includes(p.hubspot_id)
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
  )
}

function Notes() {
  const people = peopleData
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [selectedHubspotIds, setSelectedHubspotIds] = useState([])
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [filterHubspotId, setFilterHubspotId] = useState('')
  const [notes, setNotes] = useState([])
  const [attendeesByNoteId, setAttendeesByNoteId] = useState({})
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [notesError, setNotesError] = useState('')
  const [notesReloadKey, setNotesReloadKey] = useState(0)
  const [isLoadingModalAttendees, setIsLoadingModalAttendees] = useState(false)

  const formatNoteDate = (createdAt) => {
    if (!createdAt) return ''
    const d = new Date(createdAt)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  }

  const filterPerson = useMemo(() => {
    if (!filterHubspotId) return null
    return people.find((p) => p.hubspot_id === filterHubspotId) ?? null
  }, [people, filterHubspotId])

  const supabaseReady = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

  useEffect(() => {
    let cancelled = false

    const loadNotes = async () => {
      setNotesError('')

      if (!filterHubspotId) {
        setNotes([])
        setIsLoadingNotes(false)
        return
      }

      if (!supabaseReady) {
        setNotes([])
        setNotesError('Missing Supabase config: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
        setIsLoadingNotes(false)
        return
      }

      setIsLoadingNotes(true)
      try {
        // 1) find note_ids from attendees for this hubspot_id
        const attendeesTableCandidates = ['attendees', 'Attendees']
        let attendeeRows = null
        let lastAttendeeError = null

        for (const tableName of attendeesTableCandidates) {
          const { data, error } = await supabase
            .from(tableName)
            .select('note_id')
            .eq('hubspot_id', filterHubspotId)

          if (!error) {
            attendeeRows = data ?? []
            lastAttendeeError = null
            break
          }
          lastAttendeeError = error
        }

        if (lastAttendeeError) throw lastAttendeeError

        const noteIds = Array.from(new Set((attendeeRows ?? []).map((r) => r.note_id))).filter(Boolean)
        if (noteIds.length === 0) {
          if (!cancelled) {
            setNotes([])
            setAttendeesByNoteId({})
          }
          return
        }

        // 2) fetch notes by id
        const notesTableCandidates = ['notes', 'Notes']
        let noteRows = null
        let lastNotesError = null

        // Also fetch attendees for those notes (so we can display everyone associated)
        const attendeesForNotesTableCandidates = ['attendees', 'Attendees']
        let allAttendeesRows = null
        let lastAllAttendeesError = null

        const fetchNotes = async () => {
          for (const tableName of notesTableCandidates) {
            const { data, error } = await supabase
              .from(tableName)
              .select('id,note,created_at')
              .in('id', noteIds)
              .order('created_at', { ascending: false })

            if (!error) {
              noteRows = data ?? []
              lastNotesError = null
              return
            }
            lastNotesError = error
          }
        }

        const fetchAllAttendees = async () => {
          for (const tableName of attendeesForNotesTableCandidates) {
            const { data, error } = await supabase
              .from(tableName)
              .select('note_id,name')
              .in('note_id', noteIds)

            if (!error) {
              allAttendeesRows = data ?? []
              lastAllAttendeesError = null
              return
            }
            lastAllAttendeesError = error
          }
        }

        await Promise.all([fetchNotes(), fetchAllAttendees()])

        if (lastNotesError) throw lastNotesError
        // attendees fetch failure shouldn't block note display, but we'll still show an error if it happens
        if (lastAllAttendeesError) {
          console.error('Failed to load attendees for notes:', lastAllAttendeesError)
        }

        const attendeeMap = {}
        for (const row of allAttendeesRows ?? []) {
          const id = row?.note_id
          const name = row?.name
          if (!id || !name) continue
          attendeeMap[id] ??= []
          attendeeMap[id].push(name)
        }
        Object.keys(attendeeMap).forEach((id) => {
          attendeeMap[id] = Array.from(new Set(attendeeMap[id])).sort((a, b) => a.localeCompare(b))
        })

        if (!cancelled) {
          setNotes(noteRows ?? [])
          setAttendeesByNoteId(attendeeMap)
        }
      } catch (err) {
        if (!cancelled) {
          setNotes([])
          setAttendeesByNoteId({})
          setNotesError(err?.message || 'Failed to load notes.')
        }
      } finally {
        if (!cancelled) setIsLoadingNotes(false)
      }
    }

    loadNotes()

    return () => {
      cancelled = true
    }
  }, [filterHubspotId, supabaseReady, notesReloadKey])

  const closeModal = () => {
    setIsModalOpen(false)
    setNoteText('')
    setSelectedHubspotIds([])
    setEditingNoteId(null)
    setIsSaving(false)
    setSaveError('')
    setIsLoadingModalAttendees(false)
  }

  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (!isSaving) closeModal()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isModalOpen, isSaving])

  const openNewModal = () => {
    setSaveError('')
    setEditingNoteId(null)
    setNoteText('')
    setSelectedHubspotIds([])
    setIsModalOpen(true)
  }

  const loadAttendeesForNote = async (noteId) => {
    const attendeesTableCandidates = ['attendees', 'Attendees']
    let lastError = null
    for (const tableName of attendeesTableCandidates) {
      const { data, error } = await supabase
        .from(tableName)
        .select('hubspot_id')
        .eq('note_id', noteId)
      if (!error) return data ?? []
      lastError = error
    }
    throw lastError
  }

  const openEditModal = async (noteRow) => {
    setSaveError('')
    setEditingNoteId(noteRow.id)
    setNoteText(noteRow.note ?? '')
    setSelectedHubspotIds([])
    setIsModalOpen(true)

    if (!supabaseReady) return

    setIsLoadingModalAttendees(true)
    try {
      const rows = await loadAttendeesForNote(noteRow.id)
      const ids = Array.from(new Set((rows ?? []).map((r) => String(r.hubspot_id))))
      setSelectedHubspotIds(ids)
    } catch (err) {
      // Not fatal; user can still edit the note text.
      console.error('Failed to load attendees for note:', err)
    } finally {
      setIsLoadingModalAttendees(false)
    }
  }

  const handleSave = async () => {
    setSaveError('')

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      setSaveError('Missing Supabase config: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }

    const note = noteText.trim()
    if (!note) {
      setSaveError('Please write a note before saving.')
      return
    }

    const attendees = people
      .filter((p) => selectedHubspotIds.includes(p.hubspot_id))
      .map((p) => ({ hubspot_id: p.hubspot_id, name: p.name }))

    const functionName =
      import.meta.env.VITE_SUPABASE_CREATE_NOTE_FUNCTION ?? 'create_note_with_attendees'

    setIsSaving(true)
    try {
      if (editingNoteId) {
        // Edit existing note: update note text and replace attendees
        const notesTableCandidates = ['notes', 'Notes']
        let lastNotesError = null
        for (const tableName of notesTableCandidates) {
          const { error } = await supabase
            .from(tableName)
            .update({ note })
            .eq('id', editingNoteId)
          if (!error) {
            lastNotesError = null
            break
          }
          lastNotesError = error
        }
        if (lastNotesError) throw lastNotesError

        const attendeesTableCandidates = ['attendees', 'Attendees']
        let lastAttendeesError = null

        // Delete existing attendees
        for (const tableName of attendeesTableCandidates) {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('note_id', editingNoteId)
          if (!error) {
            lastAttendeesError = null
            break
          }
          lastAttendeesError = error
        }
        if (lastAttendeesError) throw lastAttendeesError

        // Insert new attendees
        if (attendees.length > 0) {
          const rowsToInsert = attendees.map((a) => ({
            note_id: editingNoteId,
            hubspot_id: a.hubspot_id,
            name: a.name
          }))

          let lastInsertError = null
          for (const tableName of attendeesTableCandidates) {
            const { error } = await supabase.from(tableName).insert(rowsToInsert)
            if (!error) {
              lastInsertError = null
              break
            }
            lastInsertError = error
          }
          if (lastInsertError) throw lastInsertError
        }
      } else {
        // Create new note via RPC
        const { data, error } = await supabase.rpc(functionName, {
          note_text: note,
          attendees
        })

        if (error) {
          throw error
        }

        // data is expected to be the new_note_id
        console.log('Saved note id:', data)
      }

      setNotesReloadKey((k) => k + 1)
      closeModal()
    } catch (err) {
      setSaveError(err?.message || 'Failed to save note.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="meetgeek-manager">
      <div className="notes-page-title-row">
        <h1 className="page-title">
          <span>Meeting Notes</span>
        </h1>
        <button
          type="button"
          className="watch-video-button"
          onClick={openNewModal}
        >
          New Note
        </button>
      </div>

      <div className="notes-filter">
        <PersonSingleSelect
          people={people}
          selectedId={filterHubspotId}
          onChange={setFilterHubspotId}
          inputId="notes-filter-person"
          label="Select a meeting attendee"
        />

        {filterPerson && (
          <div className="notes-subtitle">
            Showing notes for <strong>{filterPerson.name}</strong>
          </div>
        )}

        {isLoadingNotes && (
          <div className="message info">Loading notes...</div>
        )}

        {notesError && (
          <div className="message error">{notesError}</div>
        )}

        {!isLoadingNotes && !notesError && filterHubspotId && notes.length === 0 && (
          <div className="notes-empty">No notes found for this person.</div>
        )}

        {!isLoadingNotes && !notesError && notes.length > 0 && (
          <div className="notes-list">
            {notes.map((n) => (
              <div key={n.id} className="notes-card">
                <div className="notes-card-header">
                  <div className="notes-card-meta">{formatNoteDate(n.created_at)}</div>
                  <button
                    type="button"
                    className="notes-edit-button"
                    onClick={() => openEditModal(n)}
                  >
                    Edit
                  </button>
                </div>
                <div className="notes-card-text">{n.note}</div>
                {(attendeesByNoteId[n.id]?.length ?? 0) > 0 && (
                  <div className="notes-card-attendees">
                    <div className="notes-card-attendees-label">Attendees</div>
                    <div className="notes-attendees">
                      {attendeesByNoteId[n.id].map((name) => (
                        <span key={`${n.id}-${name}`} className="notes-attendee-chip">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="notes-modal-overlay"
          onMouseDown={() => {
            if (!isSaving) closeModal()
          }}
        >
          <div
            className="notes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-note-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="new-note-title">{editingNoteId ? 'Edit Note' : 'New Note'}</h2>

            <form
              className="gemini-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
            >
              <div className="form-group">
                <label htmlFor="notes-textarea">Note</label>
                <textarea
                  id="notes-textarea"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write your note..."
                  disabled={isSaving}
                />
              </div>

              <PeopleMultiSelect
                people={people}
                selectedIds={selectedHubspotIds}
                onChange={setSelectedHubspotIds}
                inputId="new-note-people-input"
                label="Associate with people"
              />

              {isLoadingModalAttendees && (
                <div className="message info">Loading associated people...</div>
              )}

              {saveError && (
                <div className="message error">
                  {saveError}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => closeModal()}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || !noteText.trim()}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notes

