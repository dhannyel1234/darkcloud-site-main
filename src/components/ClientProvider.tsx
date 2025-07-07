'use client';

import { SessionProvider } from 'next-auth/react';

interface ClientProviderProps {
  children: React.ReactNode;
  session: any;
}

export default function ClientProvider({ children, session }: ClientProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
} 