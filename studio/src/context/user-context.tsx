'use client';

// This file is deprecated and will be removed in a future update.
// Firebase Authentication is now used for user management.
// Please use the `useUser` hook from `@/firebase` instead.

import React, { createContext, useContext, ReactNode } from 'react';

type User = {
  name: string;
  email: string;
};

type UserContextType = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const value: UserContextType = {
      user: null,
      login: () => {},
      logout: () => {},
      updateUser: () => {},
      isLoading: true
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
