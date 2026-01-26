import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export function useSupabaseSession() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active) return
        if (error) throw error
        setSession(data?.session ?? null)
      } catch {
        if (!active) return
        setSession(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession ?? null)
    })

    return () => {
      active = false
      data?.subscription?.unsubscribe()
    }
  }, [])

  return {
    session,
    user: session?.user ?? null,
    isLoading
  }
}

