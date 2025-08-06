
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { FullScreenLoader } from '@/components/ui/loader';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('protrack_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('protrack_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('protrack_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('protrack_user');
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser(prevUser => {
        if (!prevUser) return null;
        const newUser = { ...prevUser, ...updatedData };
        localStorage.setItem('protrack_user', JSON.stringify(newUser));
        return newUser;
    });
  };

  // This can be used to protect routes
  useEffect(() => {
    if (!isLoading && !user && !['/login', '/forgot-password'].includes(pathname)) {
      // Redirect to login if not authenticated and not on a public page
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);
  
  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
