'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, RefreshCcw } from 'lucide-react';

interface RenovacaoProps {
  onHoverChange: (index: number | null) => void;
  hoveredIndex: number | null;
}

const Renovacao = ({ onHoverChange, hoveredIndex }: RenovacaoProps) => {
  // Planos de Renovação
  const renewalPlans = [
    {
      name: "Alfa",
      tier: "basic",
      price: "R$4,97",
      period: "/hora",
      description: "Uma máquina para testar e desfrutar dos melhores jogos da atualidade.",
      specs: [
        "450 JOGOS STEAM",
        "SERVIDOR BR",
        "SESSÃO LIMITADA",
        "NÃO SALVA OS ARQUIVOS",
        "CONTÉM SPOT",
        "FILA DE MÁQUINAS",
        "4 NÚCLEOS"
      ],
      recommended: false,
      url: "/order"
    },
    {
      name: "Elite 1",
      tier: "basic",
      price: "R$129,97",
      period: "/mês",
      description: "Uma máquina para jogar moderadamente durante uma semana inteira.",
      specs: [
        "450 JOGOS STEAM",
        "SERVIDOR BR",
        "SESSÃO LIMITADA",
        "NÃO SALVA OS ARQUIVOS",
        "CONTÉM SPOT",
        "FILA DE MÁQUINAS",
        "4 NÚCLEOS"
      ],
      recommended: false,
      url: "/order"
    },
    {
      name: "Prime 1",
      tier: "basic",
      price: "R$69,97",
      period: "/semana",
      description: "Uma máquina que cabe no seu bolso para jogar moderadamente o mês inteiro.",
      specs: [
        "450 JOGOS STEAM",
        "SERVIDOR BR",
        "SESSÃO LIMITADA",
        "NÃO SALVA OS ARQUIVOS",
        "CONTÉM SPOT",
        "FILA DE MÁQUINAS",
        "4 NÚCLEOS"
      ],
      recommended: false,
      url: "/order"
    },
    {
      name: "Prime",
      tier: "premium",
      price: "R$79,97",
      period: "/semana",
      description: "Uma semana de máquina para jogar sem limites a qualquer momento.",
      specs: [
        "450 JOGOS STEAM",
        "SERVIDOR BR",
        "SESSÃO ILIMITADA",
        "COM SALVAMENTO DE ARQUIVOS",
        "SPOT ALEATORIO",
        "SUJEITO A FILA",
        "4/16 NÚCLEOS"
      ],
      recommended: false,
      url: "/order"
    },
    {
      name: "Elite",
      tier: "premium",
      price: "R$149,97",
      period: "/mês",
      description: "Um mês de máquina para jogar sem limites a qualquer momento e de onde estiver.",
      specs: [
        "450 JOGOS STEAM",
        "SERVIDOR BR",
        "SESSÃO ILIMITADA",
        "COM SALVAMENTO DE ARQUIVOS",
        "SPOT ALEATORIO",
        "SUJEITO A FILA",
        "4/16 NÚCLEOS"
      ],
      recommended: false,
      url: "/order"
    },
    {
      name: "Plus",
      tier: "premium",
      price: "R$99,97",
      period: "/15 dias",
      description: "15 dias de máquina para você trabalhar e jogar ao mesmo tempo sem perder tempo.",
      specs: [
        "450 JOGOS STEAM",
        "SERVIDOR BR",
        "SESSÃO ILIMITADA",
        "COM SALVAMENTO DE ARQUIVOS",
        "SPOT ALEATORIO",
        "SUJEITO A FILA",
        "4/16 NÚCLEOS"
      ],
      recommended: false,
      url: "/order"
    }
  ];

  // Variantes para animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-900/30 rounded-lg border border-blue-500/20">
          <RefreshCcw className="h-4 w-4 text-blue-400" />
          <span className="text-blue-300 text-sm font-medium">Preços para Renovação</span>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        {renewalPlans.slice(0, 3).map((plan, index) => (
          <motion.div 
            key={index}
            variants={itemVariants}
            onMouseEnter={() => onHoverChange(index)}
            onMouseLeave={() => onHoverChange(null)}
            className={`
              relative rounded-2xl overflow-hidden transition-all duration-500
              bg-gradient-to-br from-gray-900/30 to-black/70 
              backdrop-blur-md border border-gray-700/30
              hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/20
            `}
            whileHover={{ y: -5 }}
          >
            <div className="absolute top-0 left-0 p-3">
              <div className="inline-flex items-center justify-center bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-full px-3 py-1">
                <span className="text-xs font-medium text-gray-300">Renovação {plan.name}</span>
              </div>
            </div>
            
            <div className="relative p-8 pt-12">
              {/* Brilho no canto superior quando hover */}
              {hoveredIndex === index && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-blue-500/10 blur-xl"
                />
              )}
              
              {/* Plan Header */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-4 relative"
              >
                <h3 className="text-3xl font-bold text-white mb-1">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">{plan.price}</span>
                  <span className="text-sm text-gray-400 font-normal ml-1">{plan.period}</span>
                </h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </motion.div>
              
              {/* Plan Features */}
              <ul className="space-y-2 mb-6">
                {plan.specs.map((spec, specIndex) => (
                  <motion.li 
                    key={specIndex} 
                    initial={{ opacity: 0, x: -5 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 + specIndex * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-300 text-sm">{spec}</span>
                  </motion.li>
                ))}
              </ul>
              
              {/* Call to Action */}
              <div className="pt-2">
                <motion.a
                  href={plan.url}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl py-3 font-medium transition-all duration-300
                    bg-blue-600 hover:bg-blue-500 text-white
                    flex items-center justify-center gap-2 group"
                >
                  <span>Renovar Plano</span>
                  <RefreshCcw className="h-5 w-5 group-hover:rotate-45 transition-transform" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center text-2xl font-bold text-white mb-8"
      >
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          Renovação Premium
        </span>
      </motion.h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {renewalPlans.slice(3).map((plan, index) => (
          <motion.div 
            key={index + 3}
            variants={itemVariants}
            onMouseEnter={() => onHoverChange(index + 3)}
            onMouseLeave={() => onHoverChange(null)}
            className={`
              relative rounded-2xl overflow-hidden transition-all duration-500
              bg-gradient-to-br ${plan.recommended ? 'from-blue-900/30 to-blue-950/60' : 'from-blue-950/20 to-black/70'} 
              backdrop-blur-md border ${plan.recommended ? 'border-blue-500/30' : 'border-blue-500/10'}
              ${plan.recommended 
                ? 'shadow-lg shadow-blue-500/20' 
                : 'hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/20'
              }
            `}
            whileHover={{ y: -10 }}
          >
            {/* Partículas flutuantes para o card recomendado */}
            {plan.recommended && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ 
                      opacity: 0.3,
                      x: (i * 30) - 15, // Posição fixa baseada no índice
                      y: (i * 20) + 10
                    }}
                    animate={{ 
                      opacity: [0.4, 0],
                      y: [(i * 20) + 10, (i * 20) - 20] // Movimento fixo
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 10 + (i * 2), // Duração fixa com variação baseada no índice
                      repeatType: "reverse"
                    }}
                    className="absolute w-2 h-2 rounded-full bg-blue-400/40"
                  />
                ))}
              </div>
            )}
            
            {/* Recommended Badge */}
            {plan.recommended && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="absolute top-0 left-0 w-full flex justify-center z-10"
              >
                <span className="px-6 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-xs font-medium text-white rounded-b-md shadow-lg">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Recomendado</span>
                  </div>
                </span>
              </motion.div>
            )}

            <div className="absolute top-0 left-0 p-3">
              <div className="inline-flex items-center justify-center bg-blue-900/40 backdrop-blur-sm border border-blue-500/30 rounded-full px-3 py-1">
                <span className="text-xs font-medium text-blue-100">Renovação {plan.name}</span>
              </div>
            </div>
            
            <div className="relative p-8 pt-12">
              {/* Brilho no canto superior quando hover */}
              {hoveredIndex === index + 3 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-blue-500/10 blur-xl"
                />
              )}
              
              {/* Plan Header */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-4 relative"
              >
                <h3 className="text-3xl font-bold text-white mb-1">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">{plan.price}</span>
                  <span className="text-sm text-gray-400 font-normal ml-1">{plan.period}</span>
                </h3>
                <p className="text-gray-300 text-sm">{plan.description}</p>
              </motion.div>
              
              {/* Plan Features */}
              <ul className="space-y-2 mb-6">
                {plan.specs.map((spec, specIndex) => (
                  <motion.li 
                    key={specIndex} 
                    initial={{ opacity: 0, x: -5 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 + specIndex * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className={`h-4 w-4 ${plan.recommended ? 'text-blue-400' : 'text-blue-500'} shrink-0`} />
                    <span className="text-gray-300 text-sm">{spec}</span>
                  </motion.li>
                ))}
              </ul>
              
              {/* Call to Action */}
              <div className="pt-2">
                <motion.a
                  href={plan.url}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full rounded-xl py-3 font-medium transition-all duration-300
                    ${plan.recommended 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400' 
                      : 'bg-blue-600 hover:bg-blue-500'
                    }
                    flex items-center justify-center gap-2 group shadow-md
                    ${plan.recommended ? 'shadow-blue-500/20' : ''} text-white
                  `}
                >
                  <span>Renovar Plano</span>
                  <RefreshCcw className="h-5 w-5 group-hover:rotate-45 transition-transform" />
                </motion.a>
              </div>
            </div>
            
            {/* Borda brilhante quando é o plano recomendado */}
            {plan.recommended && (
              <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/20 pointer-events-none" />
            )}
          </motion.div>
        ))}
      </motion.div>
    </>
  );
};

export default Renovacao;