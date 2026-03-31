import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getErrorMessage, getSessionToken, setSessionToken, type AuthUser, type Profile } from '@/lib/api';

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setSessionToken(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (!getSessionToken()) {
        setLoading(false);
        return;
      }

      try {
        await fetchProfile();
      } catch (err) {
        console.error('Init auth error:', err);
      } finally {
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
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const data = await api.updateProfile(updates);
      setProfile(data.profile);
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
