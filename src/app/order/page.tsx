'use client';

import { getSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';

import {
    Lock,
    CreditCard,
    ShoppingCart,
    Sparkles,
    Rocket,
    Shield,
    Zap,
    Clock,
    Info,
    CheckCircle2,
    AlertCircle,
    Package,
    DollarSign,
    Bookmark,
    ShieldCheck,
    LightbulbIcon,
    HelpCircle,
    CheckCircle,
    XCircle
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Importando estilos
import "./styles.css";

export default function Order() {
    const router = useRouter();

    const [isDialogPayError, setIsDialogPayError] = useState(false);
    const [isDialogCooldownError, setIsDialogCooldownError] = useState(false);
    const [isDialogCouponError, setIsDialogCouponError] = useState(false);
    const [couponErrorMessage, setCouponErrorMessage] = useState("");

    const [isLoading, setLoading] = useState(true);
    const [isStockQuantity, setStockQuantity] = useState(0);
    const [isSelectedPlan, setSelectedPlan] = useState("Semanal");
    const [couponCode, setCouponCode] = useState("");
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    const [isCouponLoading, setIsCouponLoading] = useState(false);
    
    const plans = {
        "Semanal": 89.97,
        "Quinzenal": 109.97,
        "Mensal": 149.97
    };
    
    // Variantes de animação
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponErrorMessage("Por favor, insira um código de cupom válido.");
            return setIsDialogCouponError(true);
        }

        setIsCouponLoading(true);
        try {
            const response = await fetch('/api/coupon/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode }),
            });

            const data = await response.json();
            
            if (!response.ok || !data.valid) {
                setCouponErrorMessage(data.message || "Cupom inválido");
                setIsCouponApplied(false);
                setCouponDiscount(0);
                setIsDialogCouponError(true);
            } else {
                setCouponDiscount(data.discount);
                setIsCouponApplied(true);
            }
        } catch (err) {
            setCouponErrorMessage("Erro ao validar o cupom. Tente novamente.");
            setIsDialogCouponError(true);
        } finally {
            setIsCouponLoading(false);
        }
    };

    const calculateFinalPrice = () => {
        const basePrice = plans[isSelectedPlan as keyof typeof plans];
        if (isCouponApplied && couponDiscount > 0) {
            const discountAmount = (basePrice * couponDiscount) / 100;
            return basePrice - discountAmount;
        }
        return basePrice;
    };

    const handleSubmit = async () => {
        if (!isLoading) {
            setLoading(true);

            const currentTime = Date.now();
            const cooldownPeriod = 30 * 1000; // 30 seconds
            const lastPaymentAttempt = localStorage.getItem('lastPaymentAttempt');
            if (lastPaymentAttempt && (currentTime - parseInt(lastPaymentAttempt) < cooldownPeriod)) {
                return setIsDialogCooldownError(true);
            };

            localStorage.setItem('lastPaymentAttempt', currentTime.toString());

            const name = isSelectedPlan;
            const price = Number(calculateFinalPrice());

            try {
                const generateId = async () => {
                    // Usar crypto.randomUUID() se disponível, senão usar timestamp + índice
                    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                        return crypto.randomUUID().replace(/-/g, '').substring(0, 24);
                    }
                    
                    // Fallback: usar timestamp + índice para evitar Math.random()
                    const timestamp = Date.now().toString(36);
                    const randomPart = Array.from({ length: 24 - timestamp.length }, (_, i) => 
                        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[i % 36]
                    ).join('');
                    return timestamp + randomPart;
                };

                const cachedSession = JSON.parse(localStorage.getItem('session') || '{}');
                const customId = await generateId();
                // Se um cupom foi aplicado, registrar seu uso
                if (isCouponApplied && couponCode) {
                    await fetch('/api/coupon/use', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: couponCode }),
                    });
                }

                const response = await fetch('/api/payment/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        customId, 
                        name, 
                        price, 
                        email: cachedSession.user?.email,
                        couponApplied: isCouponApplied ? couponCode : null,
                        discountPercent: isCouponApplied ? couponDiscount : 0
                    }),
                });

                const data = await response.json();
                if (data.message) {
                    setLoading(false);
                    return setIsDialogPayError(true);
                };

                return router.push(`/order/payment?id=${customId}`);
            } catch (err) {
                setLoading(false);
                setIsDialogPayError(true);
            };
        };
    };

    useEffect(() => {
        const checkAll = async () => {
            const response = await fetch(`/api/stock/get`);
            const data = await response.json();
            setStockQuantity(data.stock.quantity);

            const cachedSession = localStorage.getItem('session');
            if (cachedSession) {
                setLoading(false);
            } else {
                const session = await getSession();
                if (session) {
                    localStorage.setItem('session', JSON.stringify(session));
                    setLoading(false);
                } else {
                    signIn('discord', { redirect: true });
                };
            };
        };

        checkAll();
    }, []);

    return (
        <div className="min-h-full w-screen flex flex-col text-white mb-16" 
             style={{ background: 'linear-gradient(180deg, rgba(7,8,12,0) 0%, rgba(7,8,12,0.5) 100%)' }}>

            {/* Main Section */}
            <section className="flex-grow relative px-7 pt-28 lg:pt-32">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="max-w-6xl mx-auto"
                >

                    {/* Progress Line */}
                    <div className="mb-8">
                        <Progress value={23} className="h-2 bg-[#24262e] order-metallic-glow" />
                        <div className="flex justify-between text-xs text-white mt-2">
                            <span className="font-medium order-metallic-text">Plano</span>
                            <span className="text-gray-400">Pagamento</span>
                            <span className="text-gray-400">Criação</span>
                        </div>
                    </div>

                    {/* Main Plans */}
                    <div className="grid md:grid-cols-[1fr,300px] gap-8 items-start">

                        {/* Esquerda - Right */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="space-y-6"
                        >

{/* Title Section */}
<div className="backdrop-blur-md bg-gradient-to-r from-[#07080c40] to-[#11131b30] p-8 rounded-xl border border-indigo-500/10 shadow-lg relative overflow-hidden order-metallic-card">
  {/* Decorative elements */}
  <div className="absolute -top-16 -left-16 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
  <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
  
  {/* Subtle grid pattern overlay */}
  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIwMjAzMCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-5"></div>
  
  <div className="relative z-10">
    <div className="flex items-center mb-2">
      <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 px-3 py-1 mb-2">
        <Sparkles className="w-3 h-3 mr-1" /> Premium
      </Badge>
    </div>
    
    <h1 className="text-3xl font-bold mb-3 bg-gradient-to-br from-white via-indigo-200 to-blue-300 bg-clip-text text-transparent order-metallic-text">
      Escolha seu plano
    </h1>
    
    <div className="flex items-center">
      <p className="text-gray-300 max-w-lg leading-relaxed">
        Selecione um dos planos abaixo para continuar com a sua compra e comece a aproveitar todos os benefícios imediatamente.
      </p>
      
      <div className="hidden md:flex ml-auto items-center space-x-2">
        <Badge variant="outline" className="bg-green-500/10 text-green-300 border-green-500/20">
          <ShieldCheck className="w-3 h-3 mr-1" /> Seguro
        </Badge>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20">
          <CreditCard className="w-3 h-3 mr-1" /> Pagamento facilitado
        </Badge>
      </div>
    </div>
  </div>
</div>

{/* Info Plan */}
<Card className="bg-gradient-to-br from-gray-900 to-[#11131b] border-gray-700/30 backdrop-blur-sm shadow-lg hover:shadow-gray-700/10 transition-all duration-300 order-metallic-card">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-blue-500/10 mr-3">
          <ShoppingCart className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white order-metallic-text">Detalhes do Plano</h3>
      </div>

      {!isLoading && (
        <Badge 
          variant="outline" 
          className={isStockQuantity < 1 
            ? "bg-red-500/10 text-red-300 border-red-500/30"
            : "bg-blue-500/10 text-blue-300 border-blue-500/30"
          }
        >
          {isSelectedPlan || "Nenhum plano selecionado"}
        </Badge>
      )}
    </div>

    <div className="space-y-3">
      {/* Plano Selecionado */}
      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-[#171922]/90 to-[#171922]/70 border border-gray-800/30 hover:border-blue-500/20 transition-all duration-200 order-brushed-metal">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/40"></div>
        <div className="flex flex-wrap items-center justify-between p-3 pl-4">
          <div className="flex items-center">
            <Bookmark className="w-4 h-4 mr-2 text-blue-400 opacity-70" />
            <span className="text-gray-300">Plano Selecionado:</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-28" />
          ) : (
            <span className="font-medium text-white bg-blue-500/10 px-3 py-1 rounded-full text-sm">
              {isSelectedPlan || "—"}
            </span>
          )}
        </div>
      </div>

      {/* Valor Total */}
      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-[#171922]/90 to-[#171922]/70 border border-gray-800/30 hover:border-green-500/20 transition-all duration-200 order-brushed-metal">
        <div className="absolute top-0 left-0 w-1 h-full bg-green-500/40"></div>
        <div className="flex flex-wrap items-center justify-between p-3 pl-4">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-green-400 opacity-70" />
            <span className="text-gray-300">Valor Total:</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-28" />
          ) : (
            <span className="font-medium text-white bg-green-500/10 px-3 py-1 rounded-full text-sm">
              R$ {calculateFinalPrice().toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Estoque */}
      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-[#171922]/90 to-[#171922]/70 border border-gray-800/30 hover:border-purple-500/20 transition-all duration-200 order-brushed-metal">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/40"></div>
        <div className="flex flex-wrap items-center justify-between p-3 pl-4">
          <div className="flex items-center">
            <Package className="w-4 h-4 mr-2 text-purple-400 opacity-70" />
            <span className="text-gray-300">Estoque:</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-28" />
          ) : (
            <div className="flex items-center">
              <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                isStockQuantity < 1 
                  ? 'bg-red-500/10 text-red-300' 
                  : 'bg-purple-500/10 text-purple-300'
              }`}>
                {isStockQuantity} máquina{isStockQuantity !== 1 ? 's' : ''}
              </span>
              {isStockQuantity < 1 && (
                <AlertCircle className="w-4 h-4 ml-2 text-red-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {!isLoading && isSelectedPlan && (
        <div className="mt-4 text-xs text-gray-400 flex items-center bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
          <Info className="h-3 w-3 mr-2 text-blue-400" />
          <span>Os detalhes completos do plano serão enviados após a confirmação da compra</span>
        </div>
      )}
    </div>
  </CardContent>
</Card>

{/* Plan Selection */}
<Card className="bg-gradient-to-br from-gray-900 to-[#11131b] border-gray-700/30 backdrop-blur-sm shadow-lg hover:shadow-gray-700/10 transition-all duration-300 order-metallic-card">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-indigo-500/10 mr-3">
          <CreditCard className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-white order-metallic-text">Selecione seu plano</h3>
      </div>
      <Badge 
        variant="outline" 
        className={`${isStockQuantity < 1 ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-green-500/10 text-green-300 border-green-500/30'}`}
      >
        {isStockQuantity < 1 ? 'Indisponível' : `${isStockQuantity} disponíveis`}
      </Badge>
    </div>
    
    <div className="space-y-4">
      <Select
        value={isSelectedPlan}
        onValueChange={setSelectedPlan}
        disabled={isLoading || isStockQuantity < 1}
      >
        <SelectTrigger 
          className={`w-full bg-[#171922] border-gray-700 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-200 order-metallic-border ${
            isLoading || isStockQuantity < 1 ? 'opacity-60 cursor-not-allowed' : 'hover:border-indigo-500/40'
          }`}
        >
          <SelectValue placeholder="Selecione um plano" />
        </SelectTrigger>
        <SelectContent className="bg-[#171922] border border-gray-700 shadow-xl">
          <SelectGroup>
            {Object.entries(plans).map(([planName, planPrice]) => (
              <SelectItem 
                key={planName} 
                value={planName} 
                className="focus:bg-indigo-500/20 hover:bg-indigo-500/10 focus:text-white transition-colors duration-150"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{planName}</span>
                  <span className="text-indigo-300 font-semibold">R$ {planPrice.toFixed(2)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {isSelectedPlan && (
        <div className="pt-2 px-1 flex justify-between items-center text-sm">
          <span className="text-gray-400">Plano selecionado</span>
          <span className="text-white font-medium">
            {isSelectedPlan} - R$ {plans[isSelectedPlan as keyof typeof plans]?.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  </CardContent>
</Card>
                            
{/* Coupon Card */}
<Card className="bg-gradient-to-br from-gray-900 to-[#11131b] border-gray-700/30 backdrop-blur-sm shadow-lg hover:shadow-gray-700/10 transition-all duration-300 order-metallic-card">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-purple-500/10 mr-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white order-metallic-text">Cupom de desconto</h3>
      </div>
      
      {isCouponApplied && (
        <Badge className="bg-green-500/10 text-green-300 border-green-500/30">
          {couponDiscount}% off
        </Badge>
      )}
    </div>
    
    <div className="relative">
      <input
        type="text"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        placeholder="Insira seu cupom"
        className={`w-full bg-[#171922] border order-metallic-border ${
          isCouponApplied 
            ? 'border-green-500/40 text-green-300' 
            : 'border-gray-700 text-white'
        } rounded-lg px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 
        focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-200
        ${(isLoading || isStockQuantity < 1 || isCouponApplied) ? 'opacity-70 cursor-not-allowed' : ''}`}
        disabled={isLoading || isStockQuantity < 1 || isCouponLoading || isCouponApplied || !couponCode.trim()}
      />
      
      <div className="absolute right-2 top-2">
        <Button
          onClick={handleApplyCoupon}
          disabled={isLoading || isStockQuantity < 1 || isCouponLoading || isCouponApplied || !couponCode.trim()}
          className={`order-metallic-button ${
            isCouponApplied 
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          } shadow-md transition-all duration-200 px-4 py-1`}
        >
          {isCouponLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </span>
          ) : isCouponApplied ? (
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aplicado
            </span>
          ) : (
            "Aplicar"
          )}
        </Button>
      </div>
    </div>
    
    {isCouponApplied && (
      <div className="mt-3 text-sm text-green-400 flex items-center bg-green-500/5 p-3 rounded-lg border border-green-500/20">
        <div className="p-1 rounded-full bg-green-500/10 mr-2">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <span>Cupom <span className="font-semibold">{couponCode}</span> aplicado! Desconto de {couponDiscount}% no valor total.</span>
      </div>
    )}
    
    {!isCouponApplied && !isLoading && isStockQuantity > 0 && (
      <div className="mt-3 text-xs text-gray-500 flex items-center">
        <Info className="h-3 w-3 mr-1 text-gray-500" />
        <span>Use cupons promocionais para obter descontos especiais</span>
      </div>
    )}
  </CardContent>
</Card>

{/* Alert Steps */}
<Card className="bg-gradient-to-br from-gray-900 to-[#11131b] border-indigo-500/20 backdrop-blur-md shadow-xl hover:shadow-indigo-700/5 transition-all duration-300 overflow-hidden relative order-metallic-card">
  {/* Background decorative elements */}
  <div className="absolute -top-28 -right-28 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
  <div className="absolute -bottom-28 -left-28 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
  <div className="absolute top-10 left-10 w-20 h-20 bg-purple-600/5 rounded-full blur-xl pointer-events-none"></div>
  
  <CardContent className="p-6 relative z-10">
    <div className="mb-4 flex items-center">
      <div className="p-2 rounded-full bg-indigo-500/10 mr-3">
        <LightbulbIcon className="w-5 h-5 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-white order-metallic-text">Como prosseguir</h3>
    </div>
    
    <div className="space-y-6 relative">
      {/* Connecting line between steps */}
      <div className="absolute left-4 top-8 w-0.5 h-16 bg-gradient-to-b from-indigo-500/50 to-blue-500/50 rounded-full"></div>
      
      {/* Step 1 */}
      <div className="flex items-start space-x-4 group">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 
            bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full 
            shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300 relative z-20 order-metallic-glow">
          <span className="font-semibold text-xs">1</span>
        </div>
        <div className="bg-indigo-500/5 rounded-lg p-3 border border-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-200 flex-grow">
          <span className="text-gray-200 text-[15px] block">
            Selecione um plano de sua preferência no menu acima.
          </span>
          <span className="text-indigo-300 text-xs mt-1 block">
            Escolha o plano que melhor atenda às suas necessidades
          </span>
        </div>
      </div>
      
      {/* Step 2 */}
      <div className="flex items-start space-x-4 group">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 
            bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full 
            shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 relative z-20">
          <span className="font-semibold text-xs">2</span>
        </div>
        <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10 group-hover:border-blue-500/30 transition-all duration-200 flex-grow">
          <span className="text-gray-200 text-[15px] block">
            Após escolher, clique em "Continuar com o pagamento" para prosseguir.
          </span>
          <span className="text-blue-300 text-xs mt-1 block">
            Você será direcionado para a página de pagamento seguro
          </span>
        </div>
      </div>
      
      {/* Additional helper information */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400 bg-gray-800/20 p-2 rounded-lg border border-gray-700/30">
        <div className="flex items-center">
          <ShieldCheck className="h-3 w-3 mr-1.5 text-green-400" />
          <span>Pagamento 100% seguro</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1.5 text-blue-400" />
          <span>Ativação imediata</span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

                        </motion.div>

{/* Resumo de Pagamento */}
<motion.div 
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.5, delay: 0.3 }}
  className="bg-gradient-to-b from-[#11131b] to-[#0d0f16] w-full max-w-md p-8 space-y-6 text-white rounded-xl border border-indigo-500/20 shadow-2xl flex flex-col items-center self-start backdrop-blur-md relative overflow-hidden"
>
  {/* Background elements */}
  <div className="absolute -top-28 -right-28 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
  <div className="absolute -bottom-28 -left-28 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
  <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>
  
  {/* Subtle grid pattern overlay */}
  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIwMjAzMCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-5"></div>
  
  <div className="space-y-4 text-center relative z-10 w-full">
    <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-2">
      Resumo do Pedido
    </Badge>
    
    <div className="space-y-3">
      <h2 className="text-sm text-indigo-300 uppercase tracking-wider font-medium">Valor Total</h2>
      
      {isLoading ? (
        <div className="flex justify-center">
          <Skeleton className="h-10 w-40" />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {isCouponApplied && (
            <div className="text-sm line-through text-gray-500 mb-1 flex items-center">
              <XCircle className="h-3 w-3 mr-1 text-gray-500" />
              R${(plans[isSelectedPlan as keyof typeof plans]).toFixed(2)}
            </div>
          )}
          
          <div className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-200 to-blue-300 bg-clip-text text-transparent order-metallic-text"> 
            R${calculateFinalPrice().toFixed(2)}
          </div>
          
          {isCouponApplied && (
            <div className="flex items-center justify-center mt-2 bg-green-500/10 text-green-300 px-3 py-1 rounded-full border border-green-500/20">
              <Sparkles className="h-3 w-3 mr-1.5" />
              <span className="text-xs font-medium">Desconto de {couponDiscount}% aplicado</span>
            </div>
          )}
        </div>
      )}
    </div>
    
    <div className="flex items-center justify-center gap-1.5 text-sm">
      <div className="flex items-center gap-1 bg-green-500/10 text-green-300 px-3 py-1.5 rounded-full">
        <Lock className="w-4 h-4" />
        <span className="font-medium">Pagamento Seguro</span>
      </div>
    </div>
  </div>
  
  <div className="w-full space-y-4">
    {/* Benefícios */}
    <div className="bg-gradient-to-r from-gray-800/40 to-gray-800/20 rounded-lg p-3 border border-gray-700/50 order-brushed-metal">
      <ul className="space-y-2">
        <li className="flex items-start">
          <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-300">Ativação imediata após pagamento</span>
        </li>
        <li className="flex items-start">
          <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-300">Suporte técnico prioritário</span>
        </li>
        <li className="flex items-start">
          <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-300">Garantia de satisfação</span>
        </li>
      </ul>
    </div>
    
    <Separator className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/30 to-indigo-500/10 h-px" />
    
    <Button
  className={`w-full py-6 font-medium transition-all duration-300 shadow-lg border-0 relative overflow-hidden group order-metallic-button ${
    isLoading || isStockQuantity < 1 
      ? 'bg-gray-700/50 cursor-not-allowed opacity-70' 
      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-indigo-500/20'
  }`}
  onClick={handleSubmit}
  disabled={isLoading || isStockQuantity < 1}
>
  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
  
  {isLoading ? (
    <span className="flex items-center justify-center text-white">
      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      Processando...
    </span>
  ) : isStockQuantity < 1 ? (
    <span className="flex items-center justify-center text-white">
      <AlertCircle className="h-5 w-5 mr-2 text-white" />
      Sem estoque
    </span>
  ) : (
    <span className="flex items-center justify-center text-white">
      <CreditCard className="h-5 w-5 mr-2 text-white" />
      Continuar com o pagamento
    </span>
  )}
</Button>
    
    <div className="text-center text-sm flex items-center justify-center space-x-1 text-gray-400">
      <HelpCircle className="w-4 h-4" />
      <p>Precisa de ajuda? <Link href="/support" className="text-indigo-400 hover:text-indigo-300 transition-colors">Contate o suporte</Link></p>
    </div>
  </div>
</motion.div>

                    </div>

                </motion.div>
            </section>

            {/* Dialog - Payment Error */}
            {isDialogPayError && (
                <AlertDialog open={isDialogPayError} onOpenChange={setIsDialogPayError}>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <AlertDialogContent className="max-w-md w-full rounded-lg shadow-lg bg-[#11131b] border border-red-500/20 backdrop-blur-md order-metallic-card">
                            <div className="absolute inset-0 bg-gradient-to-tr from-red-900/10 to-gray-900/10 opacity-40 pointer-events-none rounded-lg"></div>
                            <AlertDialogHeader className="relative z-10">
                                <AlertDialogTitle className="text-white">Erro ao processar pagamento</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                    Ocorreu um erro ao tentar processar seu pagamento. Por favor, tente novamente mais tarde.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="relative z-10">
                                <AlertDialogCancel 
                                    onClick={() => setIsDialogPayError(false)}
                                    className="bg-transparent border border-gray-700 hover:bg-gray-800 text-white"
                                >
                                    Fechar
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </div>
                </AlertDialog>
            )}

            {/* Dialog - Cooldown Error */}
            {isDialogCooldownError && (
                <AlertDialog open={isDialogCooldownError} onOpenChange={() => {
                    setIsDialogCooldownError(false);
                    setLoading(false);
                }}>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <AlertDialogContent className="max-w-md w-full rounded-lg shadow-lg bg-[#11131b] border border-yellow-500/20 backdrop-blur-md order-metallic-card">
                            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-900/10 to-gray-900/10 opacity-40 pointer-events-none rounded-lg"></div>
                            <AlertDialogHeader className="relative z-10">
                                <AlertDialogTitle className="text-white">Cooldown Ativo</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                    Você deve esperar 3 minutos antes de tentar gerar outro pagamento.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="relative z-10">
                                <Button 
                                    variant="ghost"
                                    onClick={() => { setIsDialogCooldownError(false); setLoading(false); }}
                                    className="bg-transparent border border-gray-700 hover:bg-gray-800 text-white"
                                >
                                    Fechar
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </div>
                </AlertDialog>
            )}
            
            {/* Dialog - Coupon Error */}
            {isDialogCouponError && (
                <AlertDialog open={isDialogCouponError} onOpenChange={setIsDialogCouponError}>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <AlertDialogContent className="max-w-md w-full rounded-lg shadow-lg bg-[#11131b] border border-orange-500/20 backdrop-blur-md order-metallic-card">
                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/10 to-gray-900/10 opacity-40 pointer-events-none rounded-lg"></div>
                            <AlertDialogHeader className="relative z-10">
                                <AlertDialogTitle className="text-white">Erro no Cupom</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                    {couponErrorMessage}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="relative z-10">
                                <AlertDialogCancel 
                                    onClick={() => setIsDialogCouponError(false)}
                                    className="bg-transparent border border-gray-700 hover:bg-gray-800 text-white"
                                >
                                    Fechar
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </div>
                </AlertDialog>
            )}
            
            {/* Efeito de estrelas no fundo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
                <div className="absolute inset-0 bg-[#07080c]">
                    <div className="stars-small"></div>
                    <div className="stars-medium"></div>
                    <div className="stars-large"></div>
                </div>
            </div>

        </div>
    );
};