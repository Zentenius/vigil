"use client";
import { createContext, useContext } from 'react';
import { Realtime } from 'ably';

const AblyContext = createContext<Realtime | null>(null);

export const useAbly = () => {
  const context = useContext(AblyContext);
  if (!context) {
    throw new Error('useAbly must be used within AblyProvider');
  }
  return context;
};

interface AblyProviderProps {
  children: React.ReactNode;
}

export const AblyProvider = ({ children }: AblyProviderProps) => {
  const ably = new Realtime({
    key: process.env.NEXT_PUBLIC_ABLY_KEY!,
  });

  return (
    <AblyContext.Provider value={ably}>
      {children}
    </AblyContext.Provider>
  );
};