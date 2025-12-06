import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiFetch, getAccessToken, setAccessToken } from '../api/api'
import { clearStoredChatId } from '../utils/chatStorage'

type AuthUser = {
  id?: string | number
  email?: string
  nickname?: string
}

export type ProfileRule = {
  min_amount: number
  max_amount: number | null
  days: number
}

export type UserProfileResponse = {
  nickname?: string | null
  monthly_income?: number | null
  monthly_savings?: number | null
  current_savings?: number | null
  use_savings?: boolean
  notify_channel?: 'none' | 'email'
  notify_frequency?: 'daily' | 'weekly' | 'monthly'
  cooling_ranges?: ProfileRule[]
  blacklist_categories?: string[]
}

export type ProfileData = {
  nickname: string
  monthlyIncome: number | null
  monthlySavings: number | null
  currentSavings: number | null
  useSavings: boolean
  notifyChannel: 'none' | 'email'
  notifyFrequency: 'daily' | 'weekly' | 'monthly'
  coolingRanges: ProfileRule[]
  blacklist: string[]
}

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  profile: ProfileData | null
  isInitializing: boolean
  login: (payload: { email: string; password: string }) => Promise<void>
  register: (payload: { email: string; password: string; nickname: string }) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<ProfileData | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const normalizeProfile = (data: UserProfileResponse): ProfileData => ({
  nickname: data.nickname ?? '',
  monthlyIncome: data.monthly_income ?? null,
  monthlySavings: data.monthly_savings ?? null,
  currentSavings: data.current_savings ?? null,
  useSavings: data.use_savings ?? true,
  notifyChannel: data.notify_channel ?? 'none',
  notifyFrequency: data.notify_frequency ?? 'weekly',
  coolingRanges: data.cooling_ranges ?? [],
  blacklist: data.blacklist_categories ?? [],
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getAccessToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!token) return null
    try {
      const data = await apiFetch<UserProfileResponse>('/user/profile', {
        method: 'GET',
      })
      const normalized = normalizeProfile(data)
      setProfile(normalized)
      if (data.nickname !== undefined && data.nickname !== null) {
        setUser((prev) => ({ ...(prev ?? {}), nickname: data.nickname ?? '' }))
      }
      return normalized
    } catch (error) {
      console.error('Не удалось получить профиль', error)
      return null
    }
  }, [token])

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      if (!token) {
        setAccessToken(null)
        if (isMounted) setIsInitializing(false)
        return
      }

      setAccessToken(token)
      await refreshProfile()
      if (isMounted) setIsInitializing(false)
    }

    void init()

    return () => {
      isMounted = false
    }
  }, [refreshProfile, token])

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const data = await apiFetch<{
        access_token: string
        user?: AuthUser
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setAccessToken(data.access_token)
      setToken(data.access_token)
      setUser(data.user ?? null)
      await refreshProfile()
    },
    [refreshProfile],
  )

  const register = useCallback(
    async (payload: { email: string; password: string; nickname: string }) => {
      const data = await apiFetch<{
        access_token: string
        user?: AuthUser
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setAccessToken(data.access_token)
      setToken(data.access_token)
      setUser(data.user ?? null)
      await refreshProfile()
    },
    [refreshProfile],
  )

  const logout = useCallback(() => {
    setAccessToken(null)
    setToken(null)
    setUser(null)
    setProfile(null)
    clearStoredChatId()
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      isInitializing,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [isInitializing, login, logout, profile, refreshProfile, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
