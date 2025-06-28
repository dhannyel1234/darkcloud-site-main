'use client';

import { MoonStar } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Footer() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    interface Star {
        id: number;
        size: number;
        x: number;
        y: number;
        opacity: number;
        duration: number;
    }

    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        // Criar estrelas aleatórias para o fundo apenas no cliente
        setStars(Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            size: Math.random() * 2 + 1,
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: Math.random() * 0.7 + 0.3,
            duration: Math.random() * 10 + 5
        })));
    }, []);

    return (
        <footer className="w-full text-gray-300 py-12 px-6 overflow-hidden relative">
            {/* Removido o fundo gradiente escuro para tornar o footer transparente */}
            
            {/* Efeito de partículas/estrelas no fundo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {stars.map((star) => (
                    <motion.div
                        key={star.id}
                        className="absolute rounded-full bg-blue-100"
                        style={{
                            width: star.size,
                            height: star.size,
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            opacity: star.opacity,
                        }}
                        animate={{
                            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
                        }}
                        transition={{
                            duration: star.duration,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                ))}
                
                {/* Linhas suaves conectando elementos - reduzida opacidade */}
                <div className="absolute inset-0">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div 
                            key={i}
                            className="absolute h-px bg-gradient-to-r from-transparent via-blue-500/5 to-transparent"
                            style={{
                                top: `${20 + i * 25}%`,
                                left: 0,
                                right: 0,
                                transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
                            }}
                        />
                    ))}
                </div>
            </div>
            
            {/* Efeito de luz seguindo o cursor - reduzida opacidade */}
            <motion.div 
                className="absolute rounded-full bg-blue-500/3 blur-3xl w-96 h-96 pointer-events-none"
                animate={{
                    x: mousePosition.x - 192,
                    y: mousePosition.y - 192 - (typeof window !== 'undefined' ? window.scrollY : 0),
                }}
                transition={{
                    type: "spring",
                    damping: 15,
                    stiffness: 50,
                    mass: 0.1
                }}
            />
            
            <div className="max-w-7xl mx-auto relative z-10 backdrop-blur-[2px]">
                {/* Conteúdo centralizado com backdrop-blur sutil para melhorar legibilidade */}
                <div className="flex flex-col items-center justify-center gap-6">
                    {/* Logo da Dark Cloud */}
                    <motion.div 
                        className="flex items-center gap-3 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <div className="relative">
                            <Image src="/darkcloud.png" alt="Dark Cloud Logo" width={48} height={48} className="relative z-10" priority />
                            <motion.div 
                                className="absolute -inset-1 rounded-full blur-md bg-blue-500/20"
                                animate={{ 
                                    opacity: [0.2, 0.6, 0.2],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        </div>
                        <motion.h2 
                            className="text-xl font-bold text-white"
                            whileHover={{ color: "#60a5fa" }} // cor do blue-400
                            transition={{ duration: 0.2 }}
                        >
                            Dark<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Cloud</span>
                        </motion.h2>
                    </motion.div>
                    
                    {/* Links de navegação */}
                    <motion.div 
                        className="flex flex-wrap justify-center gap-8 my-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {["Início", "Planos", "Suporte", "FAQ", "Termos de Uso"].map((item, index) => (
                            <motion.a
                                key={index}
                                href={`#${item.toLowerCase()}`}
                                className="text-gray-200 hover:text-blue-400 transition-colors duration-300 text-sm"
                                whileHover={{ y: -2 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                {item}
                            </motion.a>
                        ))}
                    </motion.div>
                    
                    {/* Desenvolvedor - melhorada legibilidade */}
                    <motion.div 
                        className="flex items-center gap-2 mt-2 cursor-pointer group"
                        whileHover={{ y: -2 }}
                    >
                        <MoonStar className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-all duration-300" />
                        <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-all duration-300">
                            &copy; {new Date().getFullYear()} POR DARK CLOUD STORE - CNPJ: 55.566.105/0001-02. Suporte{" "}
                            <a
                                href="https://discord.com/users/1025178617069707286"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-all duration-300"
                            >
                                @rw.ts
                            </a>
                        </p>
                    </motion.div>
                    
                    {/* Decoração final */}
                    <motion.div 
                        className="w-20 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-full mt-4"
                        animate={{ 
                            opacity: [0.5, 1, 0.5],
                            width: ["5rem", "6rem", "5rem"]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </div>
        </footer>
    );
}