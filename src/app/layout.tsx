'use client';

import "./globals.css";
import "./animations.css";
import { useEffect, useState, useMemo } from 'react';

// server
import server from './server';
server();

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import Header from "@/components/header/index";
import Footer from "@/components/footer/index";
import { Toaster } from "@/components/ui/toaster";

const metadata = {
  title: "Site Oficial - Dark",
  description: "Descubra as melhores máquinas para todas as suas necessidades: trabalho, jogos de última geração, estudos, inteligência artificial, edição de vídeos e programação. Escolha um plano e viva a melhor experiência tecnológica da sua vida!",
  icon: "/Favicon.png",
  icons: {
    icon: "/Favicon.png",
    shortcut: "/Favicon.png",
    apple: "/Favicon.png"
  },
  openGraph: {
    title: "Site Oficial - Dark",
    description: "Descubra as melhores máquinas para todas as suas necessidades: trabalho, jogos de última geração, estudos, inteligência artificial, edição de vídeos e programação.",
    images: [
      {
        url: "/banner.webp",
        width: 1200,
        height: 630,
        alt: "Banner da Dark Cloud"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Dark Cloud",
    description: "Descubra as melhores máquinas para todas as suas necessidades.",
    images: ["/banner.webp"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Reduzido o número de estrelas para um visual mais limpo
  const stars = useMemo(() => {
    const starCount = 75; // Menos estrelas para um visual mais minimalista
    return Array.from({ length: starCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5, // Estrelas menores
      opacity: Math.random() * 0.5 + 0.1, // Menos visíveis
      animationDuration: Math.random() * 20 + 15
    }));
  }, []);
  
  // Apenas algumas estrelas de destaque para acento
  const accentStars = useMemo(() => {
    return Array.from({ length: 3 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 2,
      color: `hsl(${210 + Math.random() * 30}, 80%, 60%)`, // Azul mais escuro
      pulseSpeed: Math.random() * 5 + 4
    }));
  }, []);
  
  // Handle mouse movement (client-side only)
  useEffect(() => {
    setMounted(true);
    
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const routeMetadata = {
    '/machines': { title: 'Explore nossas Máquinas - Dark' },
    '/terms': { title: 'Termos e Condições - Dark' },
    '/order': { title: 'Escolha seu Plano - Dark' },
    '/order/payment': { title: 'Pagamento do Plano - Dark' },
    '/dashboard': { title: 'Painel de Controle - Dark' },
    '/dashboard/invoices': { title: 'Suas Faturas - Dark' },
  };
  const currentMetadata = routeMetadata[pathname as keyof typeof routeMetadata] || metadata;

  return (
    <html lang="pt">
      <head>
        <title>{currentMetadata.title as string}</title>
        <meta name="description" content={metadata.description as string} />
        <link rel="icon" href={metadata.icons.icon} />
        <link rel="shortcut icon" href={metadata.icons.shortcut} />
        <link rel="apple-touch-icon" href={metadata.icons.apple} />
      </head>

      <body className="antialiased overflow-x-hidden relative">
        {/* Background bem mais escuro com gradientes azuis sutis */}
        <div className="fixed inset-0 z-0">
          {/* Gradiente principal mais escuro */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020508] via-[#030a16] to-[#040d1f]"></div>
          
          {/* Nebula effect com opacidade reduzida */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute h-full w-full"
              style={{
                background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(30, 64, 124, 0.12), transparent 50%)`,
                transform: `scale(1.5)`,
                transformOrigin: 'center'
              }}
            ></div>
          </div>
          
          {/* Sutil efeito de galáxia com rotação mais lenta */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="absolute h-full w-full"
              style={{
                background: `conic-gradient(from 225deg at 50% 50%, #0a0f1700, #0c1d3a08, #0a0f1700)`,
                filter: 'blur(80px)',
                animation: 'spin 90s linear infinite'
              }}
            ></div>
          </div>
        </div>
        
        {/* Estrelas reduzidas */}
        <div className="fixed inset-0 z-1 overflow-hidden">
          {/* Estrelas regulares mais discretas */}
          {stars.map((star, index) => (
            <div 
              key={`star-${index}`}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                boxShadow: `0 0 ${star.size * 1.5}px rgba(255, 255, 255, ${star.opacity * 0.6})`,
                animation: `twinkle ${star.animationDuration}s ease-in-out infinite`
              }}
            />
          ))}
          
          {/* Estrelas de destaque mais sutis */}
          {accentStars.map((star, index) => (
            <div 
              key={`accent-${index}`}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: star.color,
                boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
                animation: `pulse ${star.pulseSpeed}s ease-in-out infinite`
              }}
            />
          ))}
        </div>
        
        {/* Glow azul escuro muito sutil */}
        <div className="fixed bottom-0 left-0 right-0 z-1 h-48 bg-gradient-to-t from-[#051a3610] to-transparent"></div>
        
        {/* Vinheta mais acentuada para escurecer as bordas */}
        <div className="fixed inset-0 z-1 bg-radial-vignette pointer-events-none"></div>
        
        {/* Noise overlay com mais contraste */}
        <div className="fixed inset-0 z-2 opacity-3 mix-blend-overlay">
          <div className="absolute inset-0 bg-noise-css"></div>
        </div>
        
        {/* Efeito aurora responsivo ao mouse mais sutil */}
        {mounted && (
          <div 
            className="fixed inset-0 z-1 pointer-events-none opacity-15"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(21, 94, 143, 0.10), transparent 35%)`,
              transition: 'background 0.4s ease'
            }}
          />
        )}
                    <Header />
        
        {/* Content wrapper with page transitions */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={pathname}
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <Toaster />
          </motion.div>
        </AnimatePresence>
        
        {/* Animações ajustadas */}
        <style jsx global>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.6; }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .bg-radial-vignette {
            background: radial-gradient(circle at center, transparent 20%, rgba(0, 0, 0, 0.7) 100%);
          }
        `}</style>
      </body>
    </html>
  );
}