import "./globals.css";
import "./animations.css";
import { Inter } from 'next/font/google';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import BackgroundEffects from '@/components/BackgroundEffects';
import Providers from '@/components/Providers';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import initializePlanChecker from '@/lib/plan-checker-initializer';

// Inicializar o checker
if (typeof window !== 'undefined') {
  initializePlanChecker();
}

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dark Cloud - Cloud Gaming',
  description: 'Jogue seus jogos favoritos em qualquer lugar, a qualquer momento.',
  icons: {
    icon: '/Favicon.png',
    shortcut: '/Favicon.png',
    apple: '/Favicon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <BackgroundEffects />
          <div className="relative">
            <Header />
            <main className={`min-h-screen pt-16`}>
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}