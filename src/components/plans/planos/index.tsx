'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, RefreshCcw } from 'lucide-react';

interface PlanosProps {
  onHoverChange: (index: number | null) => void;
  hoveredIndex?: number | null;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  specs: string[];
  recommended: boolean;
  url: string;
}

const Planos = ({ onHoverChange, hoveredIndex }: PlanosProps) => {
  // Planos de Cloud Gaming
  const gamingPlans: Plan[] = [
    {
      name: "Alfa",
      price: "R$0,01",
      period: "/1:30h",
      description: "Uma máquina para testar e desfrutar dos melhores jogos da atualidade.",
      specs: [
        "JOGOS PRÉ-INSTALADOS",
        "SERVIDOR BR",
        "SESSÃO LIMITADA",
        "NÃO SALVA OS ARQUIVOS",
        "CONTÉM SPOT",
        "FILA DE MÁQUINAS",
        "4 NÚCLEOS"
      ],
      recommended: false,
      url: "/order/basic?plan=alfa"
    },
    {
      name: "Omega",
      price: "R$0,01",
      period: "/4 horas",
      description: "Uma máquina para jogar moderadamente durante uma semana inteira.",
      specs: [
        "JOGOS PRÉ-INSTALADOS",
        "SERVIDOR BR",
        "SESSÃO LIMITADA",
        "NÃO SALVA OS ARQUIVOS",
        "CONTÉM SPOT",
        "FILA DE MÁQUINAS",
        "4 NÚCLEOS"
      ],
      recommended: false,
      url: "/order/basic?plan=omega"
    },
    {
      name: "Beta",
      price: "R$0,01",
      period: "/8 horas",
      description: "Uma máquina que cabe no seu bolso para jogar moderadamente o mês inteiro.",
      specs: [
        "JOGOS PRÉ-INSTALADOS",
        "SERVIDOR BR",
        "SESSÃO LIMITADA",
        "NÃO SALVA OS ARQUIVOS",
        "CONTÉM SPOT",
        "FILA DE MÁQUINAS",
        "4 NÚCLEOS"
      ],
      recommended: false,
      url: "/order/basic?plan=beta"
    },
    {
      name: "Prime",
      price: "R$69,97",
      period: "/semana",
      description: "Uma semana de máquina para jogar sem limites a qualquer momento.",
      specs: [
        "JOGOS PRÉ-INSTALADOS",
        "SERVIDOR BR",
        "SESSÃO ILIMITADA",
        "COM SALVAMENTO DE ARQUIVOS",
        "SPOT AS 50-AM",
        "SEM FILA",
        "4/16 NÚCLEOS"
      ],
      recommended: false,
      url: "/order"
    },
    {
      name: "Elite",
      price: "R$129,97",
      period: "/mês",
      description: "Um mês de máquina para jogar sem limites a qualquer momento e de onde estiver.",
      specs: [
        "JOGOS PRÉ-INSTALADOS",
        "SERVIDOR BR",
        "SESSÃO ILIMITADA",
        "COM SALVAMENTO DE ARQUIVOS",
        "SPOT AS 50-AM",
        "SEM FILA",
        "4/16 NÚCLEOS"
      ],
      recommended: false,
      url: "/order"
    },
    {
      name: "Plus",
      price: "R$89,97",
      period: "/15 dias",
      description: "15 dias de máquina para você trabalhar e jogar ao mesmo tempo sem perder tempo.",
      specs: [
        "JOGOS PRÉ-INSTALADOS",
        "SERVIDOR BR",
        "SESSÃO ILIMITADA",
        "COM SALVAMENTO DE ARQUIVOS",
        "SPOT AS 50-AM",
        "SEM FILA",
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        {gamingPlans.slice(0, 3).map((plan, index) => (
          <motion.div 
            key={index}
            variants={itemVariants}
            onMouseEnter={() => onHoverChange(index)}
            onMouseLeave={() => onHoverChange(null)}
            className={`
              relative rounded-2xl overflow-hidden transition-all duration-500
              bg-gradient-to-br from-gray-900/30 to-black/70 
              backdrop-blur-md border 
              ${plan.name === 'Omega' ? 'border-yellow-500/80' : 'border-gray-700/30'}
              hover:shadow-lg ${plan.name === 'Omega' ? 'hover:shadow-yellow-500/20 hover:border-yellow-500/80' : 'hover:shadow-blue-500/10 hover:border-blue-500/20'}
            `}
            whileHover={{ y: -5 }}
          >
            <div className="absolute top-0 left-0 p-3">
              <div className={`inline-flex items-center justify-center rounded-full px-3 py-1 backdrop-blur-sm ${plan.name === 'Omega' ? 'bg-yellow-400/20 border border-yellow-500/40' : 'bg-black/40 border border-gray-700/50'}` }>
                <span className={`text-xs font-medium ${plan.name === 'Omega' ? 'text-yellow-300' : 'text-gray-300'}`}>{plan.name}</span>
              </div>
            </div>
            
            <div className="relative p-8 pt-12">
              {/* Brilho no canto superior quando hover */}
              {hoveredIndex === index && plan.name === 'Omega' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-yellow-400/20 blur-xl"
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
                  <span className={`${plan.name === 'Omega' ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-700' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white'}`}>{plan.price}</span>
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
                    <CheckCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-300 text-sm">{spec}</span>
                  </motion.li>
                ))}
              </ul>
              
              {/* Call to Action */}
              <div className="pt-2">
                <a
                  href={plan.url}
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors mt-8
                    ${plan.name === 'Omega' ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 border border-yellow-600 shadow-yellow-300/30' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  Comprar Agora
                </a>
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
          Planos Premium
        </span>
      </motion.h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {gamingPlans.slice(3).map((plan, index) => (
          <motion.div 
            key={index + 3}
            variants={itemVariants}
            onMouseEnter={() => onHoverChange(index + 3)}
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
                <span className="text-xs font-medium text-gray-300">{plan.name}</span>
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
                transition={{ delay: 0.2, duration: 0.5 }}
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
                  <span>Comprar Agora</span>
                </motion.a>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
};

export default Planos;