'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar serviços
    fetch('/api/init-services')
      .then(response => response.json())
      .then(data => console.log('Status dos serviços:', data.status))
      .catch(error => console.error('Erro ao inicializar serviços:', error));
  }, []);

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
} 