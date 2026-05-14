import type { User, Session } from '@supabase/supabase-js'
import type { Profile, UserProfile } from './database'

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string, accessId: string) => Promise<{ error: string | null }>
  signUp: (data: SignUpData) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile?: () => Promise<void>
}

export interface SignUpData {
  email: string
  password: string
  full_name: string
  role: string
  access_id: string
}
