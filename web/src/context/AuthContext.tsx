import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch, getAccessToken, setAccessToken } from "../api";

type AuthUser = {
  id?: string | number;
  email?: string;
  nickname?: string;
};

export type ProfileRule = {
  min_amount: number;
  max_amount: number | null;
  days: number;
};

export type ProfileResponse = {
  nickname?: string;
  age?: number | null;
  monthly_income?: number | null;
  monthly_free_budget?: number | null;
  current_savings?: number | null;
  use_savings?: boolean;
  notification_channel?: "none" | "email";
  notification_frequency?: "daily" | "weekly" | "monthly";
  cooldown_rules?: ProfileRule[];
  blacklist_categories?: string[];
};

export type ProfileData = {
  nickname: string;
  age: number | null;
  monthlyIncome: number | null;
  monthlyFreeBudget: number | null;
  currentSavings: number | null;
  useSavings: boolean;
  notificationChannel: "none" | "email";
  notificationFrequency: "daily" | "weekly" | "monthly";
  cooldownRules: ProfileRule[];
  blacklist: string[];
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  profile: ProfileData | null;
  isInitializing: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    nickname: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<ProfileData | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const normalizeProfile = (data: ProfileResponse): ProfileData => ({
  nickname: data.nickname ?? "",
  age: data.age ?? null,
  monthlyIncome: data.monthly_income ?? null,
  monthlyFreeBudget: data.monthly_free_budget ?? null,
  currentSavings: data.current_savings ?? null,
  useSavings: data.use_savings ?? true,
  notificationChannel: data.notification_channel ?? "none",
  notificationFrequency: data.notification_frequency ?? "weekly",
  cooldownRules: data.cooldown_rules ?? [],
  blacklist: data.blacklist_categories ?? [],
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await apiFetch<ProfileResponse>("/profile", {
        method: "GET",
      });
      const normalized = normalizeProfile(data);
      setProfile(normalized);
      return normalized;
    } catch (error) {
      console.error("Не удалось получить профиль", error);
      return null;
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!token) {
        setAccessToken(null);
        if (isMounted) setIsInitializing(false);
        return;
      }

      setAccessToken(token);
      await refreshProfile();
      if (isMounted) setIsInitializing(false);
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [refreshProfile, token]);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const data = await apiFetch<{
        access_token: string;
        user?: AuthUser;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAccessToken(data.access_token);
      setToken(data.access_token);
      setUser(data.user ?? null);
      await refreshProfile();
    },
    [refreshProfile]
  );

  const register = useCallback(
    async (payload: { email: string; password: string; nickname: string }) => {
      const data = await apiFetch<{
        access_token: string;
        user?: AuthUser;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAccessToken(data.access_token);
      setToken(data.access_token);
      setUser(data.user ?? null);
      await refreshProfile();
    },
    [refreshProfile]
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
  }, []);

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
    [
      isInitializing,
      login,
      logout,
      profile,
      refreshProfile,
      register,
      token,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
