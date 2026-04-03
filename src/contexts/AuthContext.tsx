import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getErrorMessage, getSessionToken, setSessionToken, type AuthUser, type Profile } from '@/lib/api';

const AUTH_CACHE_KEY = 'tech-support-auth-cache';

type AuthCache = {
  user: AuthUser | null;
  profile: Profile | null;
};

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  changePassword: (password: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ error: null }),
  changePassword: async () => ({ error: null }),
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const readAuthCache = (): AuthCache => {
    if (typeof window === 'undefined') {
      return { user: null, profile: null };
    }

    try {
      const raw = window.localStorage.getItem(AUTH_CACHE_KEY);
      if (!raw) {
        return { user: null, profile: null };
      }

      const parsed = JSON.parse(raw) as AuthCache;
      return {
        user: parsed?.user || null,
        profile: parsed?.profile || null,
      };
    } catch {
      return { user: null, profile: null };
    }
  };

  const writeAuthCache = (nextUser: AuthUser | null, nextProfile: Profile | null) => {
    if (typeof window === 'undefined') return;

    if (!nextUser || !nextProfile) {
      window.localStorage.removeItem(AUTH_CACHE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user: nextUser, profile: nextProfile }));
  };

  const cachedAuth = readAuthCache();
  const [user, setUser] = useState<AuthUser | null>(cachedAuth.user);
  const [profile, setProfile] = useState<Profile | null>(cachedAuth.profile);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
      writeAuthCache(data.user, data.profile);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setSessionToken(null);
      setUser(null);
      setProfile(null);
      writeAuthCache(null, null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (!getSessionToken()) {
        setLoading(false);
        return;
      }

      const loadingTimeout = window.setTimeout(() => {
        setLoading(false);
      }, 1000);

      try {
        await fetchProfile();
      } catch (err) {
        console.error('Init auth error:', err);
      } finally {
        window.clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      const data = await api.signUp({
        email,
        password,
        username,
        fullName,
      });
      setSessionToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      writeAuthCache(data.user, data.profile);
      return { error: null };
    } catch (err: unknown) {
      return { error: getErrorMessage(err) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.signIn({
        email,
        password,
      });
      setSessionToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      writeAuthCache(data.user, data.profile);
      return { error: null };
    } catch (err: unknown) {
      return { error: getErrorMessage(err) };
    }
  };

  const signOut = async () => {
    try {
      await api.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setSessionToken(null);
    setUser(null);
    setProfile(null);
    writeAuthCache(null, null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const data = await api.updateProfile(updates);
      setProfile(data.profile);
      writeAuthCache(user, data.profile);
      return { error: null };
    } catch (err: unknown) {
      return { error: getErrorMessage(err) };
    }
  };

  const changePassword = async (password: string) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      await api.updatePassword(password);
      return { error: null };
    } catch (err: unknown) {
      return { error: getErrorMessage(err) };
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, changePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
