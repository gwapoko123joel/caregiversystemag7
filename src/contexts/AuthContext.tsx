import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, UserProfile } from '../types/database'
import type { SignUpData } from '../types/auth'
import { AuthContext } from './AuthContextDefinition'
import { ensureUserProfile, ensureAndGetProfile } from '../services/profileService'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Refs for state we need inside callbacks WITHOUT triggering re-renders
  const fetchingUserId = useRef<string | null>(null)
  const currentProfileId = useRef<string | null>(null)

  /**
   * Fetches the user's profile from the caregivers table.
   * 
   * IMPORTANT: This callback has NO dependencies on profile/loading state.
   * Instead, we use refs to avoid the infinite re-render loop that occurs
   * when useCallback dependencies change on every state update.
   */
  const fetchProfile = useCallback(async (userId: string) => {
    // Guard 1: Already fetching this exact user
    if (fetchingUserId.current === userId) {
      return
    }

    // Guard 2: We already have this profile loaded
    if (currentProfileId.current === userId) {
      console.log('[AuthContext] Profile already loaded for:', userId)
      return
    }

    console.log('[AuthContext] Fetching profile for UID:', userId)
    fetchingUserId.current = userId

    try {
      // Fetch from caregivers (the real table — was 'system_users' before)
      const { data: userData, error: userError } = await supabase
        .from('caregivers')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (userError) {
        console.error('[AuthContext] Profile fetch error:', userError)
        return
      }

      if (userData) {
        // Add backward-compat access_id alias from unique_access_id
        const profileWithAlias = {
          ...userData,
          access_id: userData.unique_access_id,
        } as Profile

        setProfile(profileWithAlias)
        currentProfileId.current = userId
      }

      // Also fetch the extended user_profiles row
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
  }, []) // ← NO DEPENDENCIES = no infinite loop

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] AuthStateChanged:', event)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Don't re-fetch if we're already handling this user
          if (
            fetchingUserId.current !== session.user.id &&
            currentProfileId.current !== session.user.id
          ) {
            fetchProfile(session.user.id)
          }
        } else {
          // Clear all state on sign out
          setProfile(null)
          setUserProfile(null)
          currentProfileId.current = null
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  /**
   * Sign in with email + password + access ID validation.
   * Validates that the user's caregivers row matches the provided access ID.
   */
  async function signIn(
    email: string,
    password: string,
    accessId: string
  ): Promise<{ error: string | null }> {
    console.log('[AuthContext] Starting signIn for:', email)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    if (!data.user) {
      return { error: 'Authentication succeeded but no user was returned.' }
    }

    // Fetch the full profile from caregivers to validate access_id
    const { data: profileData, error: profileError } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError || !profileData) {
      console.error('[AuthContext] Profile not found for authenticated user')
      await supabase.auth.signOut()
      return { error: 'Profile record not found. Please contact an administrator.' }
    }

    // Validate access ID (admins can use any matching access_id, others must match exactly)
    if (
      profileData.role !== 'admin' &&
      profileData.unique_access_id !== accessId
    ) {
      console.warn('[AuthContext] Access ID mismatch')
      await supabase.auth.signOut()
      return { error: 'Invalid Access ID. Please verify your credentials.' }
    }

    // Check is_active gate
    if (!profileData.is_active) {
      console.warn('[AuthContext] User is not active')
      await supabase.auth.signOut()
      return { error: 'Your account is not yet active. Please contact your administrator.' }
    }

    // Check rejection gate
    if (profileData.rejected_at) {
      console.warn('[AuthContext] User was rejected')
      await supabase.auth.signOut()
      return {
        error: `Your registration was not approved. ${profileData.rejection_reason || ''}`.trim()
      }
    }

    // Build the Profile with backward-compat access_id alias
    const profileWithAlias = {
      ...profileData,
      access_id: profileData.unique_access_id,
    } as Profile

    // Update context state
    fetchingUserId.current = data.user.id
    currentProfileId.current = data.user.id
    setSession(data.session)
    setUser(data.user)
    setProfile(profileWithAlias)

    // Ensure extended user_profile exists
    const { data: newUserProfile } = await ensureUserProfile(data.user, profileData.role)
    if (newUserProfile) setUserProfile(newUserProfile)

    // Update last_login_at and login_count (best-effort, don't block on failure)
    supabase
      .from('caregivers')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (profileData.login_count || 0) + 1,
      })
      .eq('id', data.user.id)
      .then(({ error }) => {
        if (error) console.warn('[AuthContext] Failed to update last_login:', error)
      })

    // Sync delay
    setTimeout(() => {
      setLoading(false)
      fetchingUserId.current = null
      console.log('[AuthContext] SignIn successful, state synchronized')
    }, 100)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: data.user.id,
      user_type: profileData.role,
      action: 'LOGIN',
      details: {
        role: profileData.role,
        access_id: profileData.unique_access_id,
      },
    })

    return { error: null }
  }

  /**
   * Sign up a new user. Creates auth account + caregivers row.
   * New users start with is_active = false (pending admin approval).
   */
  async function signUp(payload: SignUpData): Promise<{ error: string | null }> {
    console.log('[AuthContext] Starting signUp for:', payload.email)

    // Validate access_id uniqueness for caregivers
    if (payload.role === 'caregiver') {
      const { data: existing } = await supabase
        .from('caregivers')
        .select('id')
        .eq('unique_access_id', payload.access_id)
        .maybeSingle()
      if (existing) {
        return { error: 'This Access ID is already registered.' }
      }
    }

    // Create the auth user
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

    if (!data.user) {
      return { error: 'Sign up succeeded but no user was returned.' }
    }

    // Wait briefly for any DB trigger to create the caregivers row
    await new Promise(resolve => setTimeout(resolve, 150))

    // Check if a row already exists (created by trigger)
    const { data: existingProfile } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!existingProfile) {
      console.log('[AuthContext] Profile not found by trigger, inserting manually...')

      // Split full_name into first/last (caregivers requires both NOT NULL)
      const nameParts = payload.full_name.trim().split(/\s+/)
      const first_name = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || 'Unknown'
      const last_name = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '-'

      const newCaregiverRow = {
        id: data.user.id,
        first_name,
        last_name,
        email: payload.email,
        role: payload.role,
        unique_access_id: payload.access_id,
        is_active: false, // ← Pending approval
      }

      const { error: insertError } = await supabase
        .from('caregivers')
        .insert(newCaregiverRow)

      if (insertError) {
        console.error('[AuthContext] Manual profile insert failed:', insertError)
        return { error: 'Registration succeeded but profile creation failed. Please contact support.' }
      }
    } else {
      console.log('[AuthContext] Profile successfully created by database trigger.')
    }

    // Re-fetch the row to get the canonical version (with all defaults applied)
    const { data: finalProfile } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (finalProfile) {
      const profileWithAlias = {
        ...finalProfile,
        access_id: finalProfile.unique_access_id,
      } as Profile

      fetchingUserId.current = data.user.id
      currentProfileId.current = data.user.id
      setSession(data.session)
      setUser(data.user)
      setProfile(profileWithAlias)

      // Ensure extended user_profile exists
      const { data: newUserProfile } = await ensureUserProfile(data.user, payload.role)
      if (newUserProfile) setUserProfile(newUserProfile)
    }

    // Sync delay
    setTimeout(() => {
      setLoading(false)
      fetchingUserId.current = null
    }, 100)

    // Log registration
    await supabase.from('activity_logs').insert({
      user_id: data.user.id,
      user_type: payload.role,
      action: 'REGISTER',
      details: { role: payload.role },
    })

    return { error: null }
  }

  /**
   * Sign out and clear all state.
   */
  async function signOut() {
    if (user) {
      // Log the sign-out event (best-effort)
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_type: profile?.role,
        action: 'LOGOUT',
        details: {},
      })
    }

    // Clear refs before signing out so the auth listener doesn't re-fetch
    currentProfileId.current = null
    fetchingUserId.current = null

    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, userProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}