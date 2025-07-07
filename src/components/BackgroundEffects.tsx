'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { throttle } from 'lodash';

interface Star {
  left: number;
  top: number;
  size: number;
  opacity: number;
  color?: string;
  blur?: number;
}

interface AccentStar {
  x: number;
  y: number;
  size: number;
  color: string;
  pulseSpeed: number;
}

export default function BackgroundEffects() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [stars, setStars] = useState<Star[]>([]);
  const [accentStars, setAccentStars] = useState<AccentStar[]>([]);

  const handleMouseMove = useCallback(
    throttle((e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    }, 50),
    []
  );

  useEffect(() => {
    setMounted(true);
    
    // Gere as estrelas/partículas só no cliente!
    const generatedStars = Array.from({ length: 60 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.95 ? '#50e3c2' : Math.random() > 0.9 ? '#4a90e2' : '#fff',
      blur: Math.random() > 0.8 ? 2 : 0
    }));
    setStars(generatedStars);

    // Gerar estrelas de destaque
    const colors = ['#4a90e2', '#50e3c2', '#b8e986'];
    const generatedAccentStars = Array.from({ length: 15 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulseSpeed: Math.random() * 3 + 2
    }));
    setAccentStars(generatedAccentStars);

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      handleMouseMove.cancel(); // Cancela throttle pendente
    };
  }, [handleMouseMove]);

  // Não renderizar nada até estar montado no cliente
  if (!mounted) {
    return null;
  }

  return (
    <>
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
            className="absolute rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              backgroundColor: star.color,
              filter: star.blur ? `blur(${star.blur}px)` : undefined,
              boxShadow: star.color !== '#fff' ? `0 0 ${star.size * 2}px ${star.color}` : undefined,
              animation: star.color !== '#fff' ? `pulse ${2 + Math.random() * 3}s ease-in-out infinite` : `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
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
      <div 
        className="fixed inset-0 z-1 pointer-events-none opacity-15"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(21, 94, 143, 0.10), transparent 35%)`,
          transition: 'background 0.4s ease'
        }}
      />

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
        </motion.div>
      </AnimatePresence>
    </>
  );
} 