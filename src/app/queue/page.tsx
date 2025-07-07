'use client';

import { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from 'next/image';

import {
    Server,
    Clock,
    Users,
    Play,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Copy,
    Power,
    User,
    Timer,
    Globe,
    Lock,
    LinkIcon,
    Check,
    LockOpen,
    Tag
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface QueueStatus {
    position: number;
    status: 'waiting' | 'active' | 'completed' | 'expired';
    plan: {
        name: string;
        type: string;
        duration: number;
        startTime?: Date;
        endTime?: Date;
        alfaTimeLeftMs?: number;
    };
    machineInfo?: {
        ip: string;
        user: string;
        password: string;
        plan?: { name: string };
        name?: string;
        connectLink?: string;
    };
}

const dicas = [
    "A utilização de jogos craqueados ou qualquer arquivo torrent resultará na exclusão automática do plano sem direito a volta ou reembolso do valor.",
    "Não mine criptomoedas, nem faça overclocking em nenhuma de nossas máquinas e evite ter sua assinatura desabilitada.",
    "É totalmente proibido atualizar os drivers das máquinas virtuais."
];

export default function QueuePage() {
    const { toast } = useToast();
    const router = useRouter();

    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [isCheckingPlans, setIsCheckingPlans] = useState(true);
    const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
    const [isJoiningQueue, setIsJoiningQueue] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'alfa' | 'omega' | 'beta' | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [dicaIndex, setDicaIndex] = useState(0);
    const [dots, setDots] = useState(1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const dotsIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
    const [planoExpirado, setPlanoExpirado] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [availablePlans, setAvailablePlans] = useState<Array<{ type: string }>>([]);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const cachedSession = localStorage.getItem('session');
                if (cachedSession) {
                    setSession(JSON.parse(cachedSession));
                    setLoading(false);
                } else {
                    const session = await getSession();
                    if (session) {
                        setSession(session);
                        setLoading(false);
                        localStorage.setItem('session', JSON.stringify(session));
                    } else {
                        signIn('discord', { redirect: true });
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar sessão:', error);
                signIn('discord', { redirect: true });
            }
        };

        checkSession();
    }, []);

    useEffect(() => {
        if (session) {
            // Verificar planos ativos ao carregar a página
            (async () => {
                setIsCheckingPlans(true);
                try {
                    const plansRes = await fetch('/api/user/plans');
                    const plansData = await plansRes.json();
                    
                    if (plansData.success) {
                        setAvailablePlans(plansData.plans);
                        setPlanoExpirado(plansData.plans.length === 0);
                    } else {
                        setPlanoExpirado(true);
                    }
                } catch (error) {
                    console.error('Erro ao verificar planos:', error);
                    setPlanoExpirado(true);
                } finally {
                    setIsCheckingPlans(false);
                }
            })();
            checkQueueStatus();
            const interval = setInterval(checkQueueStatus, 10000); // Verificar a cada 10 segundos
            return () => clearInterval(interval);
        }
    }, [session]);

    useEffect(() => {
        if (queueStatus?.status === 'active' && queueStatus.plan.endTime) {
            const interval = setInterval(() => {
                const now = new Date();
                const endTime = new Date(queueStatus.plan.endTime!);
                const remaining = Math.max(0, differenceInMinutes(endTime, now));
                setTimeRemaining(remaining);

                if (remaining <= 0) {
                    checkQueueStatus();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [queueStatus]);

    useEffect(() => {
        if (!queueStatus || queueStatus.status !== 'active') return;
        
        const update = () => {
            let timeInSeconds = 0;
            
            // Para planos Alfa, usar alfaTimeLeftMs
            if (queueStatus.plan.type.toLowerCase() === 'alfa' && queueStatus.plan.alfaTimeLeftMs) {
                timeInSeconds = Math.floor(queueStatus.plan.alfaTimeLeftMs / 1000);
            } else if (queueStatus.plan.endTime) {
                // Para outros planos, calcular baseado na data de expiração
                const endTime = new Date(queueStatus.plan.endTime);
                const now = new Date();
                timeInSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
            }
            
            // Log para debug
            console.log('DEBUG - Atualizando tempo:', {
                planType: queueStatus.plan.type,
                alfaTimeLeftMs: queueStatus.plan.alfaTimeLeftMs,
                endTime: queueStatus.plan.endTime,
                timeInSeconds
            });
            
            setTimeLeft(timeInSeconds);

            // Se o tempo acabou, verificar o status da fila
            if (timeInSeconds <= 0) {
                checkQueueStatus();
            }
        };
        
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [queueStatus]);

    // Dicas rotativas
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setDicaIndex((prev) => (prev + 1) % dicas.length);
        }, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    // Animação dos três pontos
    useEffect(() => {
        if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);
        dotsIntervalRef.current = setInterval(() => {
            setDots((prev) => (prev % 3) + 1);
        }, 500);
        return () => { if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current); };
    }, []);

    const checkQueueStatus = async () => {
        try {
            const response = await fetch('/api/queue/position');
            const data = await response.json();

            if (data.success) {
                setQueueStatus(data);
            } else {
                setQueueStatus(null);
            }
        } catch (error) {
            console.error('Erro ao verificar status da fila:', error);
        }
    };

    const joinQueue = async (planType: 'alfa' | 'omega' | 'beta') => {
        setIsJoiningQueue(true);
        try {
            const response = await fetch('/api/queue/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planType }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Sucesso!",
                    description: `Entrou na fila na posição ${data.position}`,
                });
                checkQueueStatus();
            } else {
                if (data.needsPlan) {
                    setPlanoExpirado(true);
                    toast({
                        title: 'Plano não encontrado',
                        description: 'Você precisa ter um plano ativo deste tipo para entrar na fila.',
                        action: (
                            <Button onClick={() => router.push('/')}>Ver Planos</Button>
                        ),
                        duration: 10000
                    });
                } else {
                    toast({
                        title: "Erro",
                        description: data.error,
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            toast({
                title: "Erro",
                description: "Erro ao entrar na fila",
                variant: "destructive",
            });
        } finally {
            setIsJoiningQueue(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copiado!",
            description: "Informação copiada para a área de transferência",
        });
        setCopiedIndex(text);
    };

    const formatTime = (seconds: number, planType?: string) => {
        if (seconds <= 0) return '0 segundos';

        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const remainingSeconds = seconds % 60;

        let parts = [];

        // Log para debug
        console.log('DEBUG - Formatando tempo:', {
            seconds,
            planType,
            days,
            hours,
            minutes,
            remainingSeconds,
            totalDays: seconds / (24 * 60 * 60)
        });

        // Para planos Alfa, mostrar horas, minutos e segundos
        if (planType?.toLowerCase() === 'alfa') {
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
            parts.push(`${remainingSeconds}s`); // Sempre mostrar segundos
        } else {
            // Para outros planos, mostrar dias, horas e minutos
            if (days > 0) parts.push(`${days} dia${days > 1 ? 's' : ''}`);
            if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`);
            if (minutes > 0 && days === 0) parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`);
            if (remainingSeconds > 0 && days === 0 && hours === 0) parts.push(`${remainingSeconds} segundo${remainingSeconds > 1 ? 's' : ''}`);
        }

        return parts.join(' ');
    };

    // Função para formatar a data de expiração
    const formatExpirationDate = (date: string) => {
        const expDate = new Date(date);
        return expDate.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Função para sair da fila
    const sairDaFila = async () => {
        try {
            await fetch('/api/queue/leave', { method: 'POST' });
            setQueueStatus(null);
            setSelectedPlan(null);
            toast({ title: "Você saiu da fila." });
        } catch (error) {
            toast({ title: "Erro ao sair da fila", variant: "destructive" });
        }
    };

    // Fundo igual ao da home
    const Background = () => (
        <>
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#020508] via-[#030a16] to-[#040d1f]"></div>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute h-full w-full"
                        style={{ background: `radial-gradient(circle at 50% 50%, rgba(30, 64, 124, 0.12), transparent 50%)`, transform: `scale(1.5)`, transformOrigin: 'center' }}></div>
                </div>
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute h-full w-full"
                        style={{ background: `conic-gradient(from 225deg at 50% 50%, #0a0f1700, #0c1d3a08, #0a0f1700)`, filter: 'blur(80px)', animation: 'spin 90s linear infinite' }}></div>
                </div>
            </div>
        </>
    );

    if (isLoading || isCheckingPlans) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Verificando seus planos{'.'.repeat(dots)}</span>
                </div>
            </div>
        );
    }

    if (queueStatus && queueStatus.status === 'waiting') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative">
                <Background />
                <div className="flex flex-col items-center justify-center z-10">
                    <div className="flex flex-col items-center justify-center">
                        <Image src="/darkcloud.png" alt="Logo" width={96} height={96} className="animate-pulse" />
                        <h1 className="text-2xl font-bold text-gray-200 mt-4">Carregando...</h1>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Sua posição na fila:</h1>
                    <div className="text-[5rem] md:text-[8rem] font-extrabold text-[#7dd3fc] drop-shadow-lg mb-4">
                        {queueStatus.position}
                    </div>
                    <div className="text-xl text-white mb-2">Plano: <span className="text-[#7dd3fc] font-semibold">{queueStatus.plan.name}</span></div>
                    <div className="text-lg text-gray-300 mb-8 flex items-center gap-2">Status: <span className="text-blue-400 font-semibold">Aguardando sua vez{'.'.repeat(dots)}</span></div>
                    <button onClick={sairDaFila} className="mt-4 px-8 py-3 rounded-full bg-[#7dd3fc] text-[#0a192f] font-bold text-lg shadow-lg hover:bg-[#60aaff] transition">Sair da fila</button>
                    <p className="mt-8 text-gray-400 text-sm text-center max-w-md transition-all duration-500 min-h-[48px]">{dicas[dicaIndex]}</p>
                </div>
            </div>
        );
    }

    if (queueStatus && queueStatus.status === 'active') {
        const machineInfo = queueStatus.machineInfo;
        const config = [
            'AMD EPYC 2.5Ghz',
            '16RAM',
            'NVIDIA TESLA T4',
            '256GB SSD'
        ];
        let expiration = '';
        if (queueStatus.plan.endTime) {
            const date = new Date(queueStatus.plan.endTime);
            expiration = date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        const connectLink = machineInfo?.connectLink || '';
        const tutorialLink = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Troque pelo link real
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative">
                <Background />
                <div className="flex flex-col items-center justify-center z-10">
                    <div className="rounded-2xl border border-blue-400 bg-gradient-to-br from-[#10182a] via-[#151823] to-[#0a0f1a] max-w-sm w-full p-8 flex flex-col items-center shadow-2xl transition-all duration-300 hover:shadow-blue-500/30">
                        <div className="flex flex-col items-center justify-center">
                            <Image src="/darkcloud.png" alt="Logo" width={64} height={64} className="mb-3 drop-shadow-lg" />
                            <h1 className="text-2xl font-bold text-gray-200">Fila de espera</h1>
                        </div>
                        <div className="flex items-center gap-2 text-blue-300 text-3xl font-extrabold mb-1 uppercase tracking-widest drop-shadow">
                            {/* Ícone plano */}
                            <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path fill="#60a5fa" d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 21 12 17.27 7.82 21 9 12.91l-5-3.64 5.91-.01z"/></svg>
                            {queueStatus.plan.name}
                        </div>
                        <div className="w-full flex flex-col items-center mt-2 mb-2">
                            <span className="flex items-center gap-2 text-blue-200 text-base font-semibold">
                                {/* Ícone IP */}
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="#38bdf8" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="5" fill="#60a5fa"/></svg>
                                IP DA MÁQUINA
                            </span>
                            <span className="text-white text-2xl font-mono select-all font-bold tracking-wider mt-1 mb-2">{machineInfo.ip}</span>
                        </div>
                        <div className="w-full border-t border-white/10 my-2"></div>
                        <div className="w-full flex flex-col items-center mb-2">
                            <span className="flex items-center gap-2 text-blue-200 text-base font-semibold">
                                {/* Ícone calendário */}
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="4" fill="#38bdf8"/><rect x="7" y="2" width="2" height="4" rx="1" fill="#60a5fa"/><rect x="15" y="2" width="2" height="4" rx="1" fill="#60a5fa"/></svg>
                                DATA DE EXPIRAÇÃO
                            </span>
                            <span className="text-white text-xl font-bold mt-1 mb-2">
                                {queueStatus.plan.endTime ? formatExpirationDate(queueStatus.plan.endTime) : '---'}
                            </span>
                        </div>
                        <div className="w-full border-t border-white/10 my-2"></div>
                        <div className="w-full flex flex-col items-center mb-2">
                            <span className="flex items-center gap-2 text-blue-200 text-base font-semibold">
                                {/* Ícone chip/configuração */}
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#38bdf8"/><rect x="8" y="8" width="8" height="8" rx="2" fill="#60a5fa"/></svg>
                                CONFIGURAÇÕES
                            </span>
                            <div className="text-white text-sm font-bold text-center mt-1 mb-2 space-y-1">
                                {config.map((c, i) => <div key={i}>{c}</div>)}
                            </div>
                        </div>
                        <div className="w-full border-t border-white/10 my-2"></div>
                        <div className="w-full flex flex-col items-center mb-2">
                            <span className="flex items-center gap-2 text-blue-200 text-base font-semibold">
                                {/* Ícone timer */}
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#38bdf8"/><rect x="11" y="6" width="2" height="7" rx="1" fill="#60a5fa"/><rect x="11" y="12" width="5" height="2" rx="1" fill="#60a5fa"/></svg>
                                TEMPO RESTANTE
                            </span>
                            <span className="text-white text-2xl font-mono font-bold mt-1 mb-2 tracking-widest">{formatTime(timeLeft, queueStatus.plan.type)}</span>
                        </div>
                        <div className="w-full flex gap-4 justify-center mt-4">
                            <a
                                href={connectLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-white text-lg transition-all duration-200 shadow-md ${connectLink ? 'bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 cursor-pointer' : 'bg-gray-600 cursor-not-allowed'}`}
                                style={{ textDecoration: 'none' }}
                                tabIndex={connectLink ? 0 : -1}
                                aria-disabled={!connectLink}
                            >
                                {/* Logo Parsec real */}
                                <Image src="/parsec.svg" alt="Parsec" width={24} height={24} />
                                <span>Conectar via Parsec</span>
                            </a>
                            <a
                                href={tutorialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-white text-lg bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 transition-all duration-200 shadow-md"
                                style={{ textDecoration: 'none' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M10 15.172V8.828a1 1 0 0 1 1.707-.707l4.243 3.172a1 1 0 0 1 0 1.414l-4.243 3.172A1 1 0 0 1 10 15.172Z"/></svg>
                                TUTORIAL
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!queueStatus && !planoExpirado && !isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative">
                <Background />
                <div className="flex flex-col items-center justify-center z-10">
                    <h1 className="text-3xl font-bold text-white mb-6">Você possui um plano ativo!</h1>
                    <Button
                        onClick={async () => {
                            // Buscar planos ativos do usuário
                            const plansRes = await fetch('/api/user/plans');
                            const plansData = await plansRes.json();
                            if (plansData.success && plansData.plans.length > 0) {
                                // Pega o primeiro plano ativo
                                const planType = plansData.plans[0].type.toLowerCase();
                                if (['alfa', 'beta', 'omega'].includes(planType)) {
                                    await joinQueue(planType as 'alfa' | 'beta' | 'omega');
                                } else {
                                    toast({
                                        title: "Erro",
                                        description: "Tipo de plano inválido",
                                        variant: "destructive",
                                    });
                                }
                            } else {
                                setPlanoExpirado(true);
                            }
                        }}
                        className="mt-4 px-8 py-3 rounded-full bg-[#7dd3fc] text-[#0a192f] font-bold text-lg shadow-lg hover:bg-[#60aaff] transition"
                    >
                        Entrar na fila
                    </Button>
                </div>
            </div>
        );
    }

    if (planoExpirado) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
                <h2 className="text-2xl font-bold">Plano não encontrado</h2>
                <p className="text-gray-500">Você não possui nenhum plano ativo no momento. Adquira um plano para poder entrar na fila.</p>
                <Button onClick={() => router.push('/order')}>Ver Planos Disponíveis</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative">
            <Background />
            <div className="flex flex-col items-center justify-center z-10">
                {planoExpirado ? (
                    <>
                        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white text-center mb-2">Plano não encontrado</h2>
                        <p className="text-gray-400 text-center mb-6">
                            Você não possui nenhum plano ativo no momento.
                            Adquira um plano para poder entrar na fila.
                        </p>
                        <Button onClick={() => router.push('/')} className="bg-[#7dd3fc] text-[#0a192f] hover:bg-[#60aaff]">
                            Ver Planos Disponíveis
                        </Button>
                    </>
                ) : null}
            </div>
        </div>
    );
} 