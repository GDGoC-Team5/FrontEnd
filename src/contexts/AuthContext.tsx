'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe, logout as logoutApi } from '@/api/auth';
import type { User } from '@/types/api';

interface AuthValue {
  /** 로그인한 사람. 아직 확인 중이면 undefined, 로그인 안 했으면 null */
  user: User | null | undefined;
  refresh: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  user: undefined,
  refresh: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const me = await getMe({ skipAuthRedirect: true });
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <AuthContext.Provider value={{ user, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** 로그인해야 볼 수 있는 화면에서 호출. 로그인 안 했으면 /login 으로 보내요. */
export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [user, router, pathname]);
  return user;
}
