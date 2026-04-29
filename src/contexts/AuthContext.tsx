import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../lib/supabaseClient'
import type { SignUpData } from '../types/auth'
import { AuthContext } from './AuthContextDefinition'
import { ensureUserProfile, ensureAndGetProfile } from '../services/profileService'
import type { UserProfile } from '../lib/supabaseClient'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchingUserId = useRef<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    // 1. Avoid redundant fetches or concurrent ones for the same ID
    if (fetchingUserId.current === userId) return
    if (profile?.id === userId && !loading) {
      console.log('[AuthContext] Profile already loaded for:', userId)
      return
    }

    console.log('[AuthContext] Fetching profile for UID:', userId)
    fetchingUserId.current = userId
    
    // Only set global loading to true if we don't have a profile yet
    // This prevents a full UI block for simple refreshes
    if (!profile) setLoading(true)

    try {
      // 1. Primary Profile (system_users table)
      const { data: userData, error: userError } = await supabase
        .from('system_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (!userError && userData) {
        setProfile(userData as unknown as Profile)
      }

      // 2. New Profile (user_profiles table)
      const { data: profileData } = await ensureAndGetProfile()
      
      if (profileData) {
        setUserProfile(profileData)
      }

    } catch (err) {
      console.error('[AuthContext] Unexpected fetch error:', err)
    } finally {
      fetchingUserId.current = null
      setLoading(false)
    }
  }, [profile, loading])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] AuthStateChanged:', event)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // If a manual signIn/signUp is already handling this user, don't trigger another fetch
          if (fetchingUserId.current !== session.user.id) {
            fetchProfile(session.user.id)
          }
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  async function signIn(
    email: string,
    password: string,
    accessId: string
  ): Promise<{ error: string | null }> {
    console.log('[AuthContext] Starting signIn for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    if (data.user) {
      // 1. Fetch the full profile immediately to validate access_id
      const { data: profileData, error: profileError } = await supabase
        .from('system_users')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (profileError || !profileData) {
        console.error('[AuthContext] Profile not found for authenticated user')
        await supabase.auth.signOut()
        return { error: 'Profile record not found. Please contact an administrator.' }
      }

      // 2. Validate identity
      if (profileData.role !== 'admin' && profileData.access_id !== accessId) {
        console.warn('[AuthContext] Access ID mismatch')
        await supabase.auth.signOut()
        return { error: 'Invalid Access ID. Please verify your Caregiver Access ID.' }
      }

      // 3. SECURE THE STATE: Update context state before returning
      fetchingUserId.current = data.user.id
      setSession(data.session)
      setUser(data.user)
      setProfile(profileData as Profile)
      
      // 4. Ensure new user_profile exists
      const { data: newUserProfile } = await ensureUserProfile(data.user, profileData.role)
      if (newUserProfile) setUserProfile(newUserProfile)

      // 5. Sync delay
      setTimeout(() => {
        setLoading(false)
        fetchingUserId.current = null
        console.log('[AuthContext] SignIn successful, state synchronized')
      }, 100)

      // 6. Log activity
      await supabase.from('activity_logs').insert({
        user_id: data.user.id,
        user_type: profileData.role,
        action: 'LOGIN',
        details: { role: profileData.role },
      })
    }

    return { error: null }
  }

  async function signUp(payload: SignUpData): Promise<{ error: string | null }> {
    console.log('[AuthContext] Starting signUp for:', payload.email)
    // Validate access_id uniqueness
    if (payload.role === 'caregiver') {
      const { data: existing } = await supabase
        .from('system_users')
        .select('id')
        .eq('access_id', payload.access_id)
        .maybeSingle()
      if (existing) return { error: 'This Access ID is already registered.' }
    }

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.full_name,
          role: payload.role,
          access_id: payload.access_id,
        },
      },
    })

    if (error) return { error: error.message }

    if (data.user) {
       // Wait 100ms for the DB trigger to finish, then check if it created the record
       await new Promise(resolve => setTimeout(resolve, 150))
       
       const { data: existingProfile } = await supabase
         .from('system_users')
         .select('*')
         .eq('user_id', data.user.id)
         .maybeSingle()

       const newProfile = existingProfile || {
          user_id: data.user.id,
          full_name: payload.full_name,
          email: payload.email,
          role: payload.role,
          status: 'pending' as const,
          access_id: payload.access_id
       };

       if (!existingProfile) {
         console.log('[AuthContext] Profile not found by trigger, inserting manually...')
         const { error: insertError } = await supabase.from('system_users').insert(newProfile);
         if (insertError) {
           console.error('[AuthContext] Manual profile insert failed:', insertError)
           return { error: 'Registration succeeded but profile creation failed. Please contact support.' }
         }
       } else {
         console.log('[AuthContext] Profile successfully created by database trigger.')
       }
       
       // Update state for immediate use
       fetchingUserId.current = data.user.id
       setSession(data.session)
       setUser(data.user)
       setProfile(newProfile as unknown as Profile)
       
       // Ensure new user_profile exists
       const { data: newUserProfile } = await ensureUserProfile(data.user, payload.role)
       if (newUserProfile) setUserProfile(newUserProfile)

       // Sync delay before lifting loading state
       setTimeout(() => {
         setLoading(false)
         fetchingUserId.current = null
       }, 100)

       await supabase.from('activity_logs').insert({
         user_id: data.user.id,
         user_type: payload.role,
         action: 'REGISTER',
         details: { role: payload.role },
       })
    }

    return { error: null }
  }

  async function signOut() {
    if (user) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: profile?.role,
        action: 'LOGOUT',
        details: {},
      })
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, userProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

