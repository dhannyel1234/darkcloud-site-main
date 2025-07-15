'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, RefreshCcw, Clock } from 'lucide-react';
import Planos from './planos';
import Renovacao from './renovação';
import Image from 'next/image';

interface PlansProps {
  id?: string;
}

const Plans: React.FC<PlansProps> = ({ id }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'renewal'>('plans');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="relative py-24 w-full overflow-hidden" id={id}>
      {/* Efeitos de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/5 blur-3xl animate-pulse -z-10" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl animate-pulse -z-10" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl animate-pulse -z-10" style={{ animationDelay: "1.5s" }} />
      
      {/* Linhas diagonais decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transform -rotate-45"
            style={{
              top: `${20 * i}%`,
              left: '-10%',
              right: '-10%',
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 container mx-auto px-4 max-w-5xl">
        {/* Logo e Título */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-300 bg-blue-950/30 px-4 py-2 rounded-full mb-6 backdrop-blur-sm hover:bg-blue-900/40 transition-all duration-300 group border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Image src="/darkcloud.png" alt="DarkCloud" width={16} height={16} className="text-blue-400 group-hover:text-blue-300 group-hover:animate-pulse" />
              <h1 className="text-lg font-bold">DarkCloud</h1>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">
            Escolha o <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">plano ideal</span> para você
          </h3>
          <p className="text-gray-300">
            Oferecemos diferentes configurações para atender às suas necessidades de jogo,<br />
            desde títulos casuais até os mais exigentes.
          </p>
        </motion.div>

        {/* Sistema de Promoção */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center justify-center gap-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 px-6 py-3 rounded-full border border-yellow-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock className="h-5 w-5 animate-pulse" />
              <span className="font-medium">Promoção termina em:</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{timeLeft.days}</span>
                <span className="text-xs text-yellow-400/80">Dias</span>
              </div>
              <span className="text-2xl font-bold text-yellow-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="text-xs text-yellow-400/80">Horas</span>
              </div>
              <span className="text-2xl font-bold text-yellow-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="text-xs text-yellow-400/80">Min</span>
              </div>
              <span className="text-2xl font-bold text-yellow-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="text-xs text-yellow-400/80">Seg</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mensagem de Promoção */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 px-6 py-3 rounded-xl border border-yellow-500/30 backdrop-blur-sm">
            <p className="text-yellow-300 font-semibold text-lg mb-1">
              🎉 Promoção Especial de Lançamento! 🎉
            </p>
            <p className="text-yellow-100/90 text-sm">
              Aproveite <span className="text-yellow-300 font-bold">30% OFF</span> em todos os planos Premium por tempo limitado!
            </p>
          </div>
        </motion.div>

        {/* Botões de Seleção */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'plans' ? 'bg-blue-600 text-white' : 'bg-blue-950/30 text-gray-300 hover:bg-blue-900/40'}`}
          >
            <Server className="h-4 w-4" />
            <span>Novos Planos</span>
          </button>
          <button
            onClick={() => setActiveTab('renewal')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'renewal' ? 'bg-blue-600 text-white' : 'bg-blue-950/30 text-gray-300 hover:bg-blue-900/40'}`}
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Renovação</span>
          </button>
        </div>

        {/* Planos */}
        {activeTab === 'plans' && <Planos onHoverChange={setHoveredIndex} hoveredIndex={hoveredIndex} />}
        {activeTab === 'renewal' && <Renovacao onHoverChange={setHoveredIndex} hoveredIndex={hoveredIndex} />}
        
        {/* Mensagem de garantia */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <div className="bg-blue-950/20 backdrop-blur-sm border border-blue-500/10 rounded-lg px-6 py-4 max-w-3xl mx-auto">
            <p className="text-gray-300">
              <span className="text-blue-400 font-medium">Planos Premium:</span> Todos os planos Prime, Elite e Plus incluem suporte prioritário e garantia de disponibilidade 24/7.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Plans;
