import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './MeetgeekManager.css'
import { supabase } from '../lib/supabaseClient'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function formatNoteDate(createdAt) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatNoteDateForInput(createdAt) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSingleDigitHubspotId(hubspotId) {
  const s = String(hubspotId ?? '').trim()
  return /^\d$/.test(s)
}

const MemoizedMarkdown = memo(function MemoizedMarkdown({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
      }}
    >
      {content ?? ''}
    </ReactMarkdown>
  )
})

function NoteCard({
  note,
  attendees = [],
  selectedAttendeeId = null,
  isEditingDate,
  isSavingDate,
  isDeleting,
  onDateChange,
  onStartEditDate,
  onCancelEditDate,
  onEdit,
  onDelete,
  onFollowup
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleEdit = () => {
    setMenuOpen(false)
    onEdit(note)
  }
  const handleFollowup = () => {
    setMenuOpen(false)
    onFollowup?.(note, attendees)
  }
  const handleDelete = () => {
    setMenuOpen(false)
    onDelete(note)
  }

  return (
    <div className="notes-card">
      <div className="notes-card-header">
        <div className="notes-card-top">
          <div className="notes-card-meta notes-card-date-wrapper">
            {isEditingDate ? (
              <>
                <input
                  type="date"
                  className="notes-card-date-input"
                  value={formatNoteDateForInput(note.created_at)}
                  onChange={(e) => onDateChange(note.id, e.target.value)}
                  onBlur={onCancelEditDate}
                  disabled={isSavingDate}
                  autoFocus
                  aria-label="Edit note date"
                />
                {isSavingDate && (
                  <span className="notes-card-date-saving" aria-hidden="true">
                    Saving...
                  </span>
                )}
              </>
            ) : (
              <button
                type="button"
                className="notes-card-date-display"
                onClick={() => onStartEditDate(note.id)}
                title="Click to change date"
              >
                {formatNoteDate(note.created_at)}
              </button>
            )}
          </div>
          {attendees.length > 0 && (
            <div className="notes-attendees notes-attendees-inline">
              {attendees.map((a) => {
                const hubspotId = String(a.hubspot_id ?? '').trim()
                const key = `${note.id}-${hubspotId || 'unknown'}-${a.name}`
                const isHubspotPerson = Boolean(hubspotId) && !isSingleDigitHubspotId(hubspotId)
                const isSelected = selectedAttendeeId != null && String(selectedAttendeeId).trim() === hubspotId
                const className = `notes-attendee-chip${
                  isSingleDigitHubspotId(hubspotId) ? ' notes-attendee-chip--special' : ''
                }${isSelected ? ' notes-attendee-chip--selected' : ''}`

                if (isHubspotPerson) {
                  return (
                    <a
                      key={key}
                      className={className}
                      href={`https://app-eu1.hubspot.com/contacts/143614254/record/0-1/${encodeURIComponent(hubspotId)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in HubSpot"
                    >
                      {a.name}
                    </a>
                  )
                }
                return (
                  <span key={key} className={className}>
                    {a.name}
                  </span>
                )
              })}
            </div>
          )}
        </div>
        <div className="notes-card-menu" ref={menuRef}>
          <button
            type="button"
            className="notes-card-menu-trigger"
            onClick={() => setMenuOpen((o) => !o)}
            disabled={isDeleting}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Note actions"
          >
            <span className="notes-card-menu-dots" aria-hidden="true">⋯</span>
          </button>
          {menuOpen && (
            <div className="notes-card-menu-dropdown">
              <button type="button" className="notes-card-menu-item" onClick={handleEdit}>
                Edit
              </button>
              <button type="button" className="notes-card-menu-item" onClick={handleFollowup}>
                Follow up
              </button>
              <button
                type="button"
                className="notes-card-menu-item notes-card-menu-item--danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="notes-card-markdown">
        <MemoizedMarkdown content={note.note ?? ''} />
      </div>
    </div>
  )
}

const MemoizedNoteCard = memo(NoteCard)

function PersonSingleSelect({ people, selectedId, onChange, inputId, label, chipHighlight = false }) {
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
      const haystack = `${p.name ?? ''} ${p.email ?? ''}`.toLowerCase()
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
      <div className="notes-people-row">
        <label className="notes-people-label" htmlFor={inputId}>
          {label}
        </label>

        <div className="notes-people-control">
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
                            {!!p.email && (
                              <span className="notes-person-option-email">{p.email}</span>
                            )}
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

      {selectedPerson && (
        <div className="notes-selected-people">
          <button
            type="button"
            className={`notes-person-chip${chipHighlight ? ' notes-person-chip--highlight' : ''}`}
            onClick={clearSelection}
            title="Clear selection"
          >
            <span className="notes-person-chip-name">{selectedPerson.name}</span>
            <span className="notes-person-chip-remove">×</span>
          </button>
        </div>
      )}
    </div>
  )
}

function PeopleMultiSelect({ people, selectedIds, onChange, inputId, label, inputRef: inputRefProp }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const comboboxRef = useRef(null)
  const inputRef = useRef(null)

  const setInputRef = (el) => {
    inputRef.current = el
    if (inputRefProp) {
      if (typeof inputRefProp === 'function') inputRefProp(el)
      else inputRefProp.current = el
    }
  }

  const peopleById = useMemo(() => {
    return new Map((people ?? []).map((p) => [String(p.hubspot_id), p]))
  }, [people])

  const selectedPeople = useMemo(() => {
    return (selectedIds ?? [])
      .map((id) => peopleById.get(String(id)))
      .filter(Boolean)
  }, [peopleById, selectedIds])

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) => {
      const haystack = `${p.name ?? ''} ${p.email ?? ''}`.toLowerCase()
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
            ref={setInputRef}
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
                        {!!p.email && <span className="notes-person-option-email">{p.email}</span>}
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

function Notes({
  allPeople = [],
  ensureAllPeopleLoaded = async () => {},
  isLoadingAllPeople = false,
  allPeopleError = ''
}) {
  const [people, setPeople] = useState([])
  const [isLoadingPeople, setIsLoadingPeople] = useState(false)
  const [peopleError, setPeopleError] = useState('')
  const [modalAttendeeFallback, setModalAttendeeFallback] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [selectedHubspotIds, setSelectedHubspotIds] = useState([])
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [filterHubspotId, setFilterHubspotId] = useState('')
  const [notesViewMode, setNotesViewMode] = useState('by_attendee') // 'recent' | 'untagged' | 'by_attendee'
  const [notes, setNotes] = useState([])
  const [attendeesByNoteId, setAttendeesByNoteId] = useState({})
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [notesError, setNotesError] = useState('')
  const [notesReloadKey, setNotesReloadKey] = useState(0)
  const [isLoadingModalAttendees, setIsLoadingModalAttendees] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState(null)
  const meetingPeopleInputRef = useRef(null)
  const openEditModalRef = useRef(null)
  const handleDeleteNoteRef = useRef(null)

  const [savingDateId, setSavingDateId] = useState(null)
  const [editingDateId, setEditingDateId] = useState(null)

  const handleDateChange = useCallback(async (noteId, dateString) => {
    if (!dateString || !noteId) return
    const isoString = `${dateString}T12:00:00.000Z`
    if (!supabaseReady) {
      setNotesError('Missing Supabase config.')
      return
    }
    setSavingDateId(noteId)
    setNotesError('')
    try {
      const notesTableCandidates = ['notes', 'Notes']
      let lastNotesError = null
      for (const tableName of notesTableCandidates) {
        const { error } = await supabase
          .from(tableName)
          .update({ created_at: isoString })
          .eq('id', noteId)
        if (!error) {
          lastNotesError = null
          break
        }
        lastNotesError = error
      }
      if (lastNotesError) throw lastNotesError
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, created_at: isoString } : n))
      )
      setEditingDateId(null)
    } catch (err) {
      setNotesError(err?.message || 'Failed to update date.')
    } finally {
      setSavingDateId(null)
    }
  }, [])

  const onStartEditDate = useCallback((noteId) => setEditingDateId(noteId), [])
  const onCancelEditDate = useCallback(() => setEditingDateId(null), [])

  const filterPerson = useMemo(() => {
    if (!filterHubspotId) return null
    return people.find((p) => p.hubspot_id === filterHubspotId) ?? null
  }, [people, filterHubspotId])

  const supabaseReady = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

  const modalPeople = useMemo(() => {
    // Modal should include full universe of people, but also keep any "unknown" attendees visible.
    const map = new Map()
    for (const p of allPeople ?? []) {
      if (!p?.hubspot_id || !p?.name) continue
      map.set(String(p.hubspot_id), {
        hubspot_id: String(p.hubspot_id),
        name: String(p.name),
        email: p.email ? String(p.email) : undefined
      })
    }
    for (const p of modalAttendeeFallback ?? []) {
      if (!p?.hubspot_id || !p?.name) continue
      const key = String(p.hubspot_id)
      if (!map.has(key)) {
        map.set(key, { hubspot_id: key, name: String(p.name) })
      }
    }
    return Array.from(map.values())
  }, [allPeople, modalAttendeeFallback])

  useEffect(() => {
    let cancelled = false

    const loadPeople = async () => {
      setPeopleError('')

      if (!supabaseReady) {
        setPeople([])
        setIsLoadingPeople(false)
        return
      }

      setIsLoadingPeople(true)
      try {
        const attendeesTableCandidates = ['attendees', 'Attendees']
        let rows = null
        let lastError = null

        for (const tableName of attendeesTableCandidates) {
          const { data, error } = await supabase
            .from(tableName)
            .select('hubspot_id,name')

          if (!error) {
            rows = data ?? []
            lastError = null
            break
          }
          lastError = error
        }

        if (lastError) throw lastError

        const map = new Map()
        for (const r of rows ?? []) {
          const id = r?.hubspot_id
          const name = r?.name
          if (!id || !name) continue
          const key = String(id)
          if (!map.has(key)) map.set(key, String(name))
        }

        const list = Array.from(map.entries())
          .map(([hubspot_id, name]) => ({ hubspot_id, name }))
          .sort((a, b) => a.name.localeCompare(b.name))

        if (!cancelled) setPeople(list)
      } catch (err) {
        if (!cancelled) {
          setPeople([])
          setPeopleError(err?.message || 'Failed to load attendees.')
        }
      } finally {
        if (!cancelled) setIsLoadingPeople(false)
      }
    }

    loadPeople()

    return () => {
      cancelled = true
    }
  }, [supabaseReady])

  useEffect(() => {
    let cancelled = false

    const loadNotes = async () => {
      setNotesError('')

      if (!supabaseReady) {
        setNotes([])
        setNotesError('Missing Supabase config: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
        setAttendeesByNoteId({})
        setIsLoadingNotes(false)
        return
      }

      setIsLoadingNotes(true)
      try {
        const attendeesTableCandidates = ['attendees', 'Attendees']
        const notesTableCandidates = ['notes', 'Notes']
        let noteIds = []
        let noteRows = []

        // By-attendee view: show no notes until someone is selected
        if (notesViewMode === 'by_attendee' && !filterHubspotId) {
          if (!cancelled) {
            setNotes([])
            setAttendeesByNoteId({})
          }
          return
        }

        // Untagged view: notes that have no people associated
        if (notesViewMode === 'untagged') {
          let noteIdsWithAttendees = new Set()
          let lastAttendeeError = null
          for (const tableName of attendeesTableCandidates) {
            const { data, error } = await supabase
              .from(tableName)
              .select('note_id')
            if (!error) {
              ;(data ?? []).forEach((r) => {
                if (r?.note_id) noteIdsWithAttendees.add(r.note_id)
              })
              lastAttendeeError = null
              break
            }
            lastAttendeeError = error
          }
          if (lastAttendeeError) {
            console.error('Failed to load note IDs with attendees:', lastAttendeeError)
          }

          let lastNotesError = null
          for (const tableName of notesTableCandidates) {
            const { data, error } = await supabase
              .from(tableName)
              .select('id,note,created_at')
              .order('created_at', { ascending: false })
              .limit(200)
            if (!error) {
              const allRows = data ?? []
              noteRows = noteIdsWithAttendees.size === 0
                ? allRows
                : allRows.filter((r) => !noteIdsWithAttendees.has(r.id))
              lastNotesError = null
              break
            }
            lastNotesError = error
          }
          if (lastNotesError) throw lastNotesError
          noteIds = (noteRows ?? []).map((r) => r.id).filter(Boolean)
        } else if (notesViewMode === 'by_attendee' && filterHubspotId) {
          // By-attendee view with selection: notes for this person
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
          noteIds = Array.from(new Set((attendeeRows ?? []).map((r) => r.note_id))).filter(Boolean)
          if (noteIds.length === 0) {
            if (!cancelled) {
              setNotes([])
              setAttendeesByNoteId({})
            }
            return
          }
          let lastNotesError = null
          for (const tableName of notesTableCandidates) {
            const { data, error } = await supabase
              .from(tableName)
              .select('id,note,created_at')
              .in('id', noteIds)
              .order('created_at', { ascending: false })
            if (!error) {
              noteRows = data ?? []
              lastNotesError = null
              break
            }
            lastNotesError = error
          }
          if (lastNotesError) throw lastNotesError
        } else {
          // Recent view (current behavior)
          if (filterHubspotId) {
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
            noteIds = Array.from(new Set((attendeeRows ?? []).map((r) => r.note_id))).filter(Boolean)
            if (noteIds.length === 0) {
              if (!cancelled) {
                setNotes([])
                setAttendeesByNoteId({})
              }
              return
            }
            let lastNotesError = null
            for (const tableName of notesTableCandidates) {
              const { data, error } = await supabase
                .from(tableName)
                .select('id,note,created_at')
                .in('id', noteIds)
                .order('created_at', { ascending: false })
              if (!error) {
                noteRows = data ?? []
                lastNotesError = null
                break
              }
              lastNotesError = error
            }
            if (lastNotesError) throw lastNotesError
          } else {
            let lastNotesError = null
            for (const tableName of notesTableCandidates) {
              const { data, error } = await supabase
                .from(tableName)
                .select('id,note,created_at')
                .order('created_at', { ascending: false })
                .limit(5)
              if (!error) {
                noteRows = data ?? []
                lastNotesError = null
                break
              }
              lastNotesError = error
            }
            if (lastNotesError) throw lastNotesError
            noteIds = (noteRows ?? []).map((r) => r.id).filter(Boolean)
          }
        }

        // Fetch attendees for the loaded notes (so we can display everyone associated)
        let allAttendeesRows = null
        let lastAllAttendeesError = null
        if (noteIds.length > 0) {
          for (const tableName of attendeesTableCandidates) {
            const { data, error } = await supabase
              .from(tableName)
              .select('note_id,name,hubspot_id')
              .in('note_id', noteIds)

            if (!error) {
              allAttendeesRows = data ?? []
              lastAllAttendeesError = null
              break
            }
            lastAllAttendeesError = error
          }
        }

        // attendees fetch failure shouldn't block note display
        if (lastAllAttendeesError) {
          console.error('Failed to load attendees for notes:', lastAllAttendeesError)
        }

        const attendeeMap = {}
        for (const row of allAttendeesRows ?? []) {
          const noteId = row?.note_id
          const name = row?.name
          if (!noteId || !name) continue
          attendeeMap[noteId] ??= []
          attendeeMap[noteId].push({
            name: String(name),
            hubspot_id: row?.hubspot_id != null ? String(row.hubspot_id) : ''
          })
        }
        Object.keys(attendeeMap).forEach((noteId) => {
          const unique = new Map()
          for (const a of attendeeMap[noteId]) {
            const key = `${a.hubspot_id ?? ''}|${a.name ?? ''}`
            if (!unique.has(key)) unique.set(key, a)
          }
          attendeeMap[noteId] = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name))
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
  }, [filterHubspotId, notesViewMode, supabaseReady, notesReloadKey])

  const closeModal = () => {
    setIsModalOpen(false)
    setNoteText('')
    setSelectedHubspotIds([])
    setEditingNoteId(null)
    setIsSaving(false)
    setSaveError('')
    setIsLoadingModalAttendees(false)
    setModalAttendeeFallback([])
  }

  useEffect(() => {
    if (!isModalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isModalOpen])

  // When opening the modal for a new note, focus the "who is in the meeting" selector
  useEffect(() => {
    if (!isModalOpen || editingNoteId) return
    const t = setTimeout(() => meetingPeopleInputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [isModalOpen, editingNoteId])

  const openNewModal = () => {
    setSaveError('')
    setEditingNoteId(null)
    setNoteText('')
    setSelectedHubspotIds([])
    setModalAttendeeFallback([])
    ensureAllPeopleLoaded()
    setIsModalOpen(true)
  }

  const openFollowupModal = (noteRow, attendeesList = []) => {
    setSaveError('')
    setEditingNoteId(null)
    setNoteText('')
    const ids = Array.from(
      new Set(
        (attendeesList ?? [])
          .map((a) => String(a?.hubspot_id ?? '').trim())
          .filter(Boolean)
      )
    )
    setSelectedHubspotIds(ids)
    setModalAttendeeFallback(
      (attendeesList ?? [])
        .map((a) => ({
          hubspot_id: String(a?.hubspot_id ?? ''),
          name: String(a?.name ?? '')
        }))
        .filter((p) => p.hubspot_id && p.name)
    )
    ensureAllPeopleLoaded()
    setIsModalOpen(true)
  }

  const loadAttendeesForNote = async (noteId) => {
    const attendeesTableCandidates = ['attendees', 'Attendees']
    let lastError = null
    for (const tableName of attendeesTableCandidates) {
      const { data, error } = await supabase
        .from(tableName)
        .select('hubspot_id,name')
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
    setModalAttendeeFallback([])
    ensureAllPeopleLoaded()
    setIsModalOpen(true)

    if (!supabaseReady) return

    setIsLoadingModalAttendees(true)
    try {
      const rows = await loadAttendeesForNote(noteRow.id)
      const ids = Array.from(new Set((rows ?? []).map((r) => String(r.hubspot_id))))
      setSelectedHubspotIds(ids)
      setModalAttendeeFallback(
        (rows ?? [])
          .map((r) => ({ hubspot_id: String(r?.hubspot_id ?? ''), name: String(r?.name ?? '') }))
          .filter((p) => p.hubspot_id && p.name)
      )
    } catch (err) {
      // Not fatal; user can still edit the note text.
      console.error('Failed to load attendees for note:', err)
    } finally {
      setIsLoadingModalAttendees(false)
    }
  }

  const handleDeleteNote = async (noteRow) => {
    if (!noteRow?.id) return

    const ok = window.confirm('Delete this note? This cannot be undone.')
    if (!ok) return

    setNotesError('')

    if (!supabaseReady) {
      setNotesError('Missing Supabase config: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }

    setDeletingNoteId(noteRow.id)
    try {
      const attendeesTableCandidates = ['attendees', 'Attendees']
      let lastAttendeesError = null

      // Delete attendees first (in case there's no ON DELETE CASCADE)
      for (const tableName of attendeesTableCandidates) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('note_id', noteRow.id)
        if (!error) {
          lastAttendeesError = null
          break
        }
        lastAttendeesError = error
      }
      // If attendees table doesn't exist, it's fine; note delete will still be attempted.
      if (lastAttendeesError) {
        console.error('Failed to delete attendees for note:', lastAttendeesError)
      }

      const notesTableCandidates = ['notes', 'Notes']
      let lastNotesError = null

      for (const tableName of notesTableCandidates) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', noteRow.id)
        if (!error) {
          lastNotesError = null
          break
        }
        lastNotesError = error
      }
      if (lastNotesError) throw lastNotesError

      // Update UI immediately
      setNotes((prev) => prev.filter((n) => n.id !== noteRow.id))
      setAttendeesByNoteId((prev) => {
        const next = { ...prev }
        delete next[noteRow.id]
        return next
      })

      if (isModalOpen && editingNoteId === noteRow.id) {
        closeModal()
      }

      setNotesReloadKey((k) => k + 1)
    } catch (err) {
      setNotesError(err?.message || 'Failed to delete note.')
    } finally {
      setDeletingNoteId(null)
    }
  }

  openEditModalRef.current = openEditModal
  handleDeleteNoteRef.current = handleDeleteNote
  const onEdit = useCallback((noteRow) => openEditModalRef.current?.(noteRow), [])
  const onDelete = useCallback((noteRow) => handleDeleteNoteRef.current?.(noteRow), [])
  const onFollowup = useCallback((noteRow, attendeesList) => {
    openFollowupModal(noteRow, attendeesList)
  }, [])

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

    const peopleById = new Map(
      [...(modalPeople ?? []), ...(people ?? [])].map((p) => [String(p.hubspot_id), p])
    )
    const attendees = selectedHubspotIds
      .map((id) => {
        const p = peopleById.get(String(id))
        if (p?.name) return { hubspot_id: String(id), name: String(p.name) }
        return { hubspot_id: String(id), name: String(id) }
      })

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
          className="notes-new-note-button"
          onClick={openNewModal}
        >
          New Note
        </button>
      </div>

      <div className="notes-view-tabs">
        <button
          type="button"
          className={`notes-view-tab${notesViewMode === 'by_attendee' ? ' active' : ''}`}
          onClick={() => {
            setNotesViewMode('by_attendee')
            setFilterHubspotId('')
          }}
        >
          By attendee
        </button>
        <button
          type="button"
          className={`notes-view-tab${notesViewMode === 'recent' ? ' active' : ''}`}
          onClick={() => {
            setNotesViewMode('recent')
          }}
        >
          Recent
        </button>
        <button
          type="button"
          className={`notes-view-tab${notesViewMode === 'untagged' ? ' active' : ''}`}
          onClick={() => {
            setNotesViewMode('untagged')
            setFilterHubspotId('')
          }}
        >
          Untagged notes
        </button>
      </div>

      <div className="notes-filter">
        {peopleError && <div className="message error">{peopleError}</div>}
        {isLoadingPeople && <div className="message info">Loading attendees...</div>}
        {(notesViewMode === 'recent' || notesViewMode === 'by_attendee') && (
          <PersonSingleSelect
            people={people}
            selectedId={filterHubspotId}
            onChange={setFilterHubspotId}
            inputId="notes-filter-person"
            label="Select a meeting attendee"
            chipHighlight={notesViewMode === 'by_attendee'}
          />
        )}

        {notesViewMode === 'recent' && !filterPerson && (
          <div className="notes-subtitle notes-subtitle-recent">
            Recent Meetings
          </div>
        )}
        {notesViewMode === 'untagged' && (
          <div className="notes-subtitle notes-subtitle-untagged">
            Untagged notes
          </div>
        )}

        {isLoadingNotes && (
          <div className="message info">Loading notes...</div>
        )}

        {notesError && (
          <div className="message error">{notesError}</div>
        )}
        {!isLoadingNotes && !notesError && filterHubspotId && notes.length === 0 && (
          <div className="notes-empty">No notes found for this attendee.</div>
        )}
        {!isLoadingNotes && !notesError && notesViewMode === 'recent' && !filterHubspotId && notes.length === 0 && (
          <div className="notes-empty">No notes yet.</div>
        )}
        {!isLoadingNotes && !notesError && notesViewMode === 'untagged' && notes.length === 0 && (
          <div className="notes-empty">No untagged notes.</div>
        )}

        {!isLoadingNotes && !notesError && notes.length > 0 && (
          <div className="notes-list">
            {notes.map((n) => (
              <MemoizedNoteCard
                key={n.id}
                note={n}
                attendees={attendeesByNoteId[n.id] ?? []}
                selectedAttendeeId={notesViewMode === 'by_attendee' ? filterHubspotId : null}
                isEditingDate={editingDateId === n.id}
                isSavingDate={savingDateId === n.id}
                isDeleting={deletingNoteId === n.id}
                onDateChange={handleDateChange}
                onStartEditDate={onStartEditDate}
                onCancelEditDate={onCancelEditDate}
                onEdit={onEdit}
                onDelete={onDelete}
                onFollowup={onFollowup}
              />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="notes-modal-overlay">
          <div
            className="notes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-note-title"
          >
            <h2 id="new-note-title">{editingNoteId ? 'Edit Note' : 'New Note'}</h2>

            <form
              className="gemini-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
            >
              <PeopleMultiSelect
                people={modalPeople}
                selectedIds={selectedHubspotIds}
                onChange={setSelectedHubspotIds}
                inputId="new-note-people-input"
                label="Who was in the meeting?"
                inputRef={meetingPeopleInputRef}
              />

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

              {allPeopleError && (
                <div className="message error">
                  {allPeopleError}
                </div>
              )}

              {isLoadingAllPeople && (
                <div className="message info">Loading people list...</div>
              )}

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

