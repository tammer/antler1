import { useCallback, useEffect, useMemo, useState } from 'react'

const PEOPLE_WEBHOOK_URL = 'http://api.tammer.com/full'

function normalizePeople(raw) {
  const list = Array.isArray(raw) ? raw : []
  return list
    .map((p) => {
      const hubspotId = p?.hubspot_id ?? p?.hubspotId ?? p?.id
      const name = p?.name
      const email = p?.email

      const hubspot_id = hubspotId != null ? String(hubspotId).trim() : ''
      const normalizedName = name != null ? String(name).trim() : ''
      const normalizedEmail = email != null ? String(email).trim() : ''

      if (!hubspot_id || !normalizedName) return null

      return {
        hubspot_id,
        name: normalizedName,
        email: normalizedEmail ? normalizedEmail : undefined
      }
    })
    .filter(Boolean)
}

function mergePeople(staticPeople, remotePeople) {
  const map = new Map()

  const add = (p, source) => {
    const key = String(p.hubspot_id)
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { ...p, hubspot_id: key })
      return
    }

    const merged = { ...existing }

    // Prefer remote values when present; otherwise fill gaps.
    if (source === 'remote') {
      if (p.name) merged.name = p.name
      if (p.email) merged.email = p.email
    } else {
      if (!merged.name && p.name) merged.name = p.name
      if (!merged.email && p.email) merged.email = p.email
    }

    map.set(key, merged)
  }

  for (const p of normalizePeople(staticPeople)) add(p, 'static')
  for (const p of normalizePeople(remotePeople)) add(p, 'remote')

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function useAllPeople({ enabled = true } = {}) {
  const [remotePeople, setRemotePeople] = useState([])
  const [isLoadingRemotePeople, setIsLoadingRemotePeople] = useState(false)
  const [remotePeopleError, setRemotePeopleError] = useState('')

  const [staticPeople, setStaticPeople] = useState(null)
  const [isLoadingAllPeople, setIsLoadingAllPeople] = useState(false)
  const [allPeopleError, setAllPeopleError] = useState('')

  useEffect(() => {
    if (!enabled) {
      setRemotePeople([])
      setRemotePeopleError('')
      setIsLoadingRemotePeople(false)
      setStaticPeople(null)
      setAllPeopleError('')
      setIsLoadingAllPeople(false)
      return
    }

    let cancelled = false
    const controller = new AbortController()

    const loadRemote = async () => {
      setRemotePeopleError('')
      setIsLoadingRemotePeople(true)

      try {
        const res = await fetch(PEOPLE_WEBHOOK_URL, { signal: controller.signal })
        if (!res.ok) {
          throw new Error(`Failed to fetch people (${res.status}).`)
        }
        const data = await res.json()
        if (!cancelled) setRemotePeople(normalizePeople(data))
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (!cancelled) {
          setRemotePeople([])
          setRemotePeopleError(err?.message || 'Failed to fetch people.')
        }
      } finally {
        if (!cancelled) setIsLoadingRemotePeople(false)
      }
    }

    loadRemote()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [enabled])

  const ensureAllPeopleLoaded = useCallback(async () => {
    if (!enabled) return
    if (isLoadingAllPeople) return
    if ((staticPeople?.length ?? 0) > 0) return

    setAllPeopleError('')
    setIsLoadingAllPeople(true)
    try {
      const mod = await import('../data/people.json')
      const raw = mod?.default ?? []
      setStaticPeople(normalizePeople(raw))
    } catch (err) {
      setStaticPeople([])
      setAllPeopleError(err?.message || 'Failed to load people list.')
    } finally {
      setIsLoadingAllPeople(false)
    }
  }, [enabled, isLoadingAllPeople, staticPeople])

  const allPeople = useMemo(() => {
    // If static isn't loaded yet, this will be the remote list only.
    return mergePeople(staticPeople ?? [], remotePeople ?? [])
  }, [staticPeople, remotePeople])

  return {
    allPeople,
    ensureAllPeopleLoaded,
    isLoadingAllPeople,
    allPeopleError,
    // Exposed for future UX (optional)
    isLoadingRemotePeople,
    remotePeopleError
  }
}

