'use client';

import Link from "next/link";
import Image from "next/image";
import "./styles.css";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import QRCode from 'qrcode';

import {
    ExternalLink,
    Check,
    Copy,
    Lock,
    Cloudy
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

// saves
const DISCORD_GUILD_INVITE = "https://discord.gg/HQbRRazKbB";

export default function Payment() {
    const router = useRouter();

    const [isDialogAccountError, setIsDialogAccountError] = useState(false);
    const [isDialogPaymentError, setIsDialogPaymentError] = useState(false);
    const [isDialogMachineError, setIsDialogMachineError] = useState(false);

    const [isStock, setStock] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isCreated, setIsCreated] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);

    const [paymentInfo, setPaymentInfo] = useState({
        id: 0,
        status: '',
        price: 0,
        plan: '',
        created: true,
        date: new Date().toISOString(),
        QRImage: '',
        QRCode: ''
    });

    const [creationProgress, setCreationProgress] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const urlParams = new URLSearchParams(window.location.search);
        const customId = urlParams.get('id') || "";

        // global
        const checkAll = async () => {
            try {
                const responseStock = await fetch(`/api/stock/get`);
                const dataStock = await responseStock.json();
                if (Number(dataStock.stock.quantity) < 1) {
                    setStock(false);
                } else {
                    setStock(true);
                };

                const response = await fetch(`/api/payment/get?id=${customId}`);
                const data = await response.json();
                if (data.message) {
                    return router.push("/");
                };

                //console.log(data.pix.location);

                QRCode.toDataURL(data.pix.pixCopiaECola)
                  .then((qrImageBase64) => {
                    setPaymentInfo({
                      id: data._doc.custom_id,
                      status: data.pix.status,
                      price: Number(data.pix.valor.original),
                      plan: data._doc.plan,
                      created: data._doc.machine_created,
                      date: new Date(data.pix.calendario.criacao).toISOString(),
                      QRImage: qrImageBase64, // imagem gerada do código Copia e Cola
                      QRCode: data.pix.pixCopiaECola,
                    });
                  })
                  .catch((err) => {
                    console.error("Erro ao gerar QR Code:", err);
                  });
                                

                const cachedSession = localStorage.getItem('session');
                if (cachedSession) {
                    setSession(JSON.parse(cachedSession));
                    setIsLoading(false);
                } else {
                    const session = await getSession();
                    if (session) {
                        localStorage.setItem('session', JSON.stringify(session));

                        setSession(session);
                        setIsLoading(false);
                    } else {
                        signIn('discord', { redirect: true });
                    };

                    return;
                };

                // user session - json
                const jsonSession = cachedSession ? JSON.parse(cachedSession) : session;

                // payment [methods]
                if (data.pix.status === "CONCLUIDA") {
                    setIsLoading(true);

                    // verify if the payment has been checked
                    if (!data._doc.checked_all) {
                        await fetch('/api/payment/update', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                customId,
                                name: data._doc.plan,
                                email: jsonSession.user?.email,
                                checked_all: true,
                                machine_created: true
                            }),
                        });

                        const responseStock = await fetch(`/api/stock/get`);
                        const dataStock = await responseStock.json();
                        if (Number(dataStock.stock.quantity) < 1) {
                            await fetch('/api/payment/refund', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ customId }),
                            });
                        } else {
                            setIsApproved(true);

                            // webhook
                            const dataSuccess = {
                                "embeds": [
                                    {
                                        "author": {
                                            "name": `#${data._doc.custom_id}`,
                                        },
                                        "title": `Pagamento Aprovado`,
                                        "fields": [
                                            { "name": "<:xsCart:1235401137767714878> Plano Adquirido:", "value": `${data._doc.plan}` },
                                            { "name": "<:wPrice:1261136034654191698> Valor pago:", "value": `R$: ${Number(data.pix.valor.original)}`},
                                            { "name": "<:xsSend:1241241326394277918> E-mail do usuário:", "value": `${jsonSession.user.email}` }
                                        ],
                                        "color": 65280,
                                        "thumbnail": { "url": `${jsonSession.user.image}` },
                                        "footer": { "text": "@nebulahost.gg" },
                                        "timestamp": new Date().toISOString()
                                    }
                                ],
                                "content": `**${jsonSession.user.id ? `<@${jsonSession.user.id}> | @${jsonSession.user.name} | ${jsonSession.user.id}` : `@${jsonSession.user.name}`}**`
                            };
                            await fetch('/api/webhook/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ data: dataSuccess }),
                            });

                            // edit stock
                            const newQuantity = Number(dataStock.stock.quantity) - 1;
                            await fetch('/api/stock/edit', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ quantity: newQuantity }),
                            });

                            // start progress animation when creating machine
                            setIsCreating(true);
                            setCreationProgress(0);
                            const progressInterval = setInterval(() => {
                                setCreationProgress(prev => {
                                    if (prev >= 90) return prev;
                                    return prev + 10;
                                });
                            }, 1000);

                            // generate a random id for the machine name
                            const machineRandomId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

                            // create machine in azure
                            const azureName = `cls-${jsonSession?.user.name}`;
                            const responseMachine = await fetch('/api/azure/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', },
                                body: JSON.stringify({
                                    name: azureName,
                                    vmSize: 'Standard_NC4as_T4_v3',
                                    userId: jsonSession?.user.id
                                }),
                            });

                            // clear interval and set to 100% when complete
                            clearInterval(progressInterval);

                            // verify if the machine has been created
                            if (responseMachine.ok) {
                                setCreationProgress(100);
                                setIsCreated(true);
                                setIsCreating(false);

                                // create machine in database
                                const dbName = `cls-${jsonSession?.user.name}`;
                                const days = data._doc.plan === "Semanal" ? 7 : data._doc.plan === "Quinzenal" ? 15 : data._doc.plan === "Mensal" ? 30 : 30;
                                await fetch('/api/machine/create', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', },
                                    body: JSON.stringify({
                                        name: dbName.replace(/\./g, '-').replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''),
                                        surname: `cls-${jsonSession?.user.name.replaceAll(".", "-")}`,
                                        host: "azure",
                                        userId: jsonSession?.user.id,
                                        days,
                                        plan: data._doc.plan
                                    }),
                                });

                                // give discord role to user
                                await fetch('/api/role/give', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', },
                                    body: JSON.stringify({ user_id: jsonSession.user?.id }),
                                });

                            } else {
                                await fetch('/api/payment/update', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        customId,
                                        name: data._doc.plan,
                                        email: jsonSession.user?.email,
                                        checked_all: true,
                                        machine_created: false
                                    }),
                                });

                                // webhook
                                const dataMachine = await responseMachine.json();
                                const dataError = {
                                    "embeds": [
                                        {
                                            "author": {
                                                "name": `#${data.id}`,
                                            },
                                            "title": `Erro de Implantação`,
                                            "description": `Erro ao criar a máquina do usuário <@${jsonSession.user.id}>! Veja os detalhes abaixo.`,
                                            "fields": [
                                                { "name": "<:xsInfo:1194353575514603521> Tamanho:", "value": `Standard_NC4as_T4_v3` },
                                                { "name": "<:xsAlert:1241295369535492118> Mensagem:", "value": `${dataMachine.message ? dataMachine.message : "Não encontrada"}` }
                                            ],
                                            "color": 16711680,
                                            "thumbnail": { "url": `${jsonSession.user.image}` },
                                            "footer": { "text": "@nebulahost.gg" },
                                            "timestamp": new Date().toISOString()
                                        }
                                    ],
                                    "content": `**${jsonSession.user.id ? `<@${jsonSession.user.id}> | @${jsonSession.user.name} | ${jsonSession.user.id}` : `@${jsonSession.user.name}`}**`
                                };
                                await fetch('/api/webhook/send', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ data: dataError }),
                                });

                                return setIsDialogMachineError(true);
                            };

                            clearInterval(intervalId);
                            setIsLoading(false);
                        };
                    } else {
                        clearInterval(intervalId);
                        setIsApproved(true);
                        setIsCreated(true);
                        setIsLoading(false);
                    };

                    return clearTimeout(data.timeout_id);
                } else if (data.status === "refunded") {
                    setIsLoading(true);

                    // verify if the payment has been checked
                    if (!data._doc.checked_all) {
                        const dataRefunded = {
                            "embeds": [
                                {
                                    "author": {
                                        "name": `#${data.id}`,
                                    },
                                    "title": `Compra Cancelada`,
                                    "description": "O usuário teve sua compra cancelada pois o estoque de máquinas acabou. Alguém adquiriu a última máquina do estoque antes dele.",
                                    "fields": [
                                        { "name": "<:xsCart:1235401137767714878> Plano Adquirido:", "value": `${data._doc.plan}` },
                                        { "name": "<:wPrice:1261136034654191698> Valor pago:", "value": `R$${data.transaction_amount}` },
                                        { "name": "<:xsSend:1241241326394277918> E-mail do usuário:", "value": `${jsonSession.user.email}` }
                                    ],
                                    "color": 16711680,
                                    "thumbnail": { "url": `${jsonSession.user.image}` },
                                    "footer": { "text": "@nebulahost.gg" },
                                    "timestamp": new Date().toISOString()
                                },
                                {
                                    "description": "O pagamento do usuário foi reembolsado com sucesso.",
                                    "color": 2895667,
                                }
                            ],
                            "content": `**${jsonSession.user.id ? `<@${jsonSession.user.id}> | @${jsonSession.user.name} | ${jsonSession.user.id}` : `@${jsonSession.user.name}`}**`
                        };
                        await fetch('/api/webhook/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: dataRefunded }),
                        });

                        await fetch('/api/payment/update', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ customId, name: data._doc.plan, email: jsonSession.user?.email, checked_all: true }),
                        });
                    };

                    clearInterval(intervalId);
                    clearTimeout(data.timeout_id);

                    setIsCreated(false);
                    setIsCancelled(true);
                    return setIsLoading(false);
                };
            } catch (err) {
                setIsDialogPaymentError(true);
            };
        };

        checkAll();
        const intervalId = setInterval(checkAll, 3000);

        return () => clearInterval(intervalId);
    }, [router]);

    return (
        <div className="payment-page min-h-full w-screen flex flex-col items-center justify-center text-white mb-16">
            {/* Efeito de estrelas */}
            <div className="stars-small"></div>
            <div className="stars-medium"></div>
            <div className="stars-large"></div>

            {/* Main Section */}
            <section className="flex-grow relative px-7 pt-28 lg:pt-32">
                <div className="max-w-6xl mx-auto">

{/* Progress Line 1 - Com estilo da progress bar 2 */}
<div className="mb-8">
    <Progress value={isApproved ? 100 : isCancelled ? 100 : 50} className="h-2 bg-[#24262e]" />
    <div className="flex justify-between text-xs text-white mt-2">
        <span className="font-medium text-purple-400">Plano</span>
        <span className={isApproved || isCancelled ? "font-medium text-purple-400" : "text-gray-400"}>Pagamento</span>
        <span className={isApproved ? "font-medium text-purple-400" : "text-gray-400"}>
            {isApproved ? "Aprovado" : isCancelled ? "Cancelado" : "Aprovação"}
        </span>
    </div>
</div>

                    {/* Main Payment */}
                    {isCreating ? (
                        <div className="grid md:grid-cols-[1fr,300px] gap-10">

                            {/* Esquerda - Right */}
                            <div className="space-y-6">

                                {/* Title */}
                                <div className="payment-container p-6">
                                    <h1 className="text-2xl font-medium mb-4 text-glow">Criando Máquina!</h1>
                                    <p className="text-gray-400">
                                        Seu pagamento foi aprovado com sucesso! Estamos configurando sua máquina virtual e em breve ela estará pronta para uso.
                                    </p>
                                </div>

                                {/* Creation Progress */}
                                <div className="space-y-2">
                                    <div className="progress-container">
                                        <Progress value={creationProgress} className="h-2 bg-[#24262e] progress-bar" />
                                    </div>
                                    <p className="text-sm text-gray-400 animate-pulse">Criando sua máquina virtual...</p>
                                </div>

                                {/* Info Payment */}
                                <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">ID da transação:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-24 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.id}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Data da transação:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-44 items-center" />
                                        ) : (
                                            <span className="items-center">
                                                {new Intl.DateTimeFormat('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                }).format(new Date(paymentInfo.date))} às {new Intl.DateTimeFormat('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }).format(new Date(paymentInfo.date))}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Status da transação: </span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-20 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.status == "approved" ? "Aprovado" : paymentInfo.status == "pending" ? "Pendente" : "Aguardando"}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Plano Selecionado:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-24 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.plan}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#171922] text-white rounded-full">
                                            1
                                        </div>
                                        <span className="flex-grow text-gray-300 text-[14px]">Aguarde enquanto configuramos sua máquina virtual (2-3 minutos).</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#171922] text-white rounded-full">
                                            2
                                        </div>
                                        <span className="flex-grow text-gray-300 text-[14px]">Após a criação, você será redirecionado automaticamente.</span>
                                    </div>
                                </div>

                            </div>

                            {/* Direita - Left */}
                            <div className="payment-card bg-[#11131b] w-full max-w-md p-6 px-6 space-y-5 text-white rounded-lg flex-col items-center self-start md:flex hidden">
                                <div className="space-y-2 text-center">
                                    <h2 className="text-sm text-gray-400">Valor Pago</h2>
                                    {isLoading ? (
                                        <div className="flex justify-center">
                                            <Skeleton className="h-9 w-36 text-3xl font-semibold" />
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-semibold"> R${paymentInfo.price.toFixed(2)}</div>
                                    )}
                                    <div className="flex items-center justify-center gap-1.5 text-sm text-green-500">
                                        <Check className="w-4 h-4" />
                                        <span>Pagamento Aprovado!</span>
                                    </div>
                                </div>
                                <div className="nebula-separator"></div>
                                <div className="text-center text-sm text-gray-400">
                                    <p>Seu pagamento foi aprovado. Agradecemos pela sua compra!</p>
                                </div>
                            </div>

                        </div>
                    ) : isCreated ? (
                        <div className="grid md:grid-cols-[1fr,300px] gap-10">

                            {/* Esquerda - Right */}
                            <div className="space-y-6">

                                {/* Title */}
                                <div className="payment-container p-6">
                                    <h1 className="text-2xl font-medium mb-4 text-glow">Criando Máquina!</h1>
                                    <p className="text-gray-400">
                                        Seu pagamento foi aprovado com sucesso! Estamos configurando sua máquina virtual e em breve ela estará pronta para uso.
                                    </p>
                                </div>

                                {/* Creation Progress */}
                                <div className="space-y-2">
                                    <Progress value={paymentInfo.created ? 100 : 0} className="h-2 bg-[#24262e]" />
                                    <p className={`text-sm ${paymentInfo.created ? "text-green-400" : "text-red-400"}`}>
                                        {paymentInfo.created ? "Máquina virtual criada com sucesso!" : "Erro ao criar a máquina virtual."}
                                    </p>
                                </div>

                                {/* Info Payment */}
                                <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">ID da transação:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-24 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.id}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Data da transação:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-44 items-center" />
                                        ) : (
                                            <span className="items-center">
                                                {new Intl.DateTimeFormat('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                }).format(new Date(paymentInfo.date))} às {new Intl.DateTimeFormat('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }).format(new Date(paymentInfo.date))}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Status da transação: </span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-20 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.status == "approved" ? "Aprovado" : paymentInfo.status == "pending" ? "Pendente" : "Pendente"}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Plano Selecionado:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-24 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.plan}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#171922] text-white rounded-full">
                                            1
                                        </div>
                                        <span className="flex-grow text-gray-300 text-[14px]">
                                            {paymentInfo.created ? "Sua máquina virtual foi criada com sucesso e já está pronta para uso!"
                                                : "Houve um erro na criação da máquina virtual."}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#171922] text-white rounded-full">
                                            2
                                        </div>
                                        <span className="flex-grow text-gray-300 text-[14px]">
                                            {paymentInfo.created ? "Clique no botão abaixo para acessar o painel de controle."
                                                : "Por favor, entre em contato com o suporte."}
                                        </span>
                                    </div>

                                    {paymentInfo.created ? (
                                        <Link className="w-full" href="/dashboard">
                                            <Button className="relative z-10 w-full h-11 flex items-center justify-center nebula-button">
                                                <span>Painel de Controle</span>
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link className="w-full" href={DISCORD_GUILD_INVITE}
                                            target="_blank" rel="noopener noreferrer">
                                            <Button className="relative z-10 w-full h-11 flex items-center justify-center nebula-button">
                                                <span>Discord</span>
                                                <ExternalLink className="w-4 h-4 ml-2 animate-bounce-x" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>

                            </div>

                            {/* Direita - Left */}
                            <div className="payment-card bg-[#11131b] w-full max-w-md p-6 px-6 space-y-5 text-white rounded-lg flex-col items-center self-start md:flex hidden">
                                <div className="space-y-2 text-center">
                                    <h2 className="text-sm text-gray-400">Valor Pago</h2>
                                    {isLoading ? (
                                        <div className="flex justify-center">
                                            <Skeleton className="h-9 w-36 text-3xl font-semibold" />
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-semibold"> R${paymentInfo.price.toFixed(2)}</div>
                                    )}
                                    <div className="flex items-center justify-center gap-1.5 text-sm text-green-500">
                                        <Check className="w-4 h-4" />
                                        <span>Pagamento Aprovado!</span>
                                    </div>
                                </div>
                                <div className="nebula-separator"></div>
                                <div className="text-center text-sm text-gray-400">
                                    <p>Seu pagamento foi aprovado. Agradecemos pela sua compra!</p>
                                </div>
                            </div>

                        </div>
                    ) : isCancelled ? (
                        <div className="grid md:grid-cols-[1fr,300px] gap-10">

                            {/* Esquerda - Left */}
                            <div className="space-y-6">

                                {/* Title */}
                                <div>
                                    <h1 className="text-2xl font-medium mb-4">Compra Cancelada!</h1>
                                    <p className="text-gray-400">
                                        Infelizmente, sua compra foi cancelada porque outra pessoa adquiriu a última máquina disponível antes de você. Não se preocupe, seu pagamento já foi reembolsado!
                                    </p>
                                </div>

                                {/* Info Payment */}
                                <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">ID da transação:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-24 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.id}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Data da transação:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-44 items-center" />
                                        ) : (
                                            <span className="items-center">
                                                {new Intl.DateTimeFormat('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                }).format(new Date(paymentInfo.date))} às {new Intl.DateTimeFormat('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }).format(new Date(paymentInfo.date))}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Status da transação: </span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-20 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.status === "approved" ? "Aprovado" : paymentInfo.status === "refunded" ? "Reembolsado" : paymentInfo.status === "pending" ? "Pendente" : "Pendente"}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Plano Selecionado:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-24 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.plan}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Alert [Not Stock] */}
                                {!isStock ? (
                                    <div className="flex flex-col md:flex-row">
                                        <Alert variant="default" className="bg-transparent text-gray-400">
                                            <Cloudy className="h-4 w-4" />
                                            <AlertTitle className="text-gray-200">Estoque Indisponível</AlertTitle>
                                            <AlertDescription>
                                                No momento, estamos sem estoque. Por favor, aguarde o reabastecimento das máquinas.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row">
                                        <Alert variant="default" className="bg-transparent text-gray-400">
                                            <Cloudy className="h-4 w-4" />
                                            <AlertTitle className="text-gray-200">Estoque Disponível</AlertTitle>
                                            <AlertDescription>
                                                Temos o prazer de informar que o estoque foi reabastecido. Você pode prosseguir com a sua compra agora!
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )}

                            </div>

                            {/* Direita - Left */}
                            <div className="payment-card bg-[#11131b] w-full max-w-md p-6 px-6 space-y-5 text-white rounded-lg flex-col items-center self-start md:flex hidden">
                                <div className="space-y-2 text-center">
                                    <h2 className="text-sm text-gray-400">Valor Pago</h2>
                                    {isLoading ? (
                                        <div className="flex justify-center">
                                            <Skeleton className="h-9 w-36 text-3xl font-semibold" />
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-semibold"> R${paymentInfo.price.toFixed(2)}</div>
                                    )}
                                    <div className="flex items-center justify-center gap-1.5 text-sm text-green-500">
                                        <Check className="w-4 h-4" />
                                        <span>Pagamento Aprovado!</span>
                                    </div>
                                </div>
                                <div className="nebula-separator"></div>
                                <div className="text-center text-sm text-gray-400">
                                    <p>Seu pagamento foi aprovado. Agradecemos pela sua compra!</p>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="grid md:grid-cols-[1fr,300px] gap-10">

                            {/* Esquerda - Left */}
                            <div className="space-y-6">

                                {/* Title */}
                                <div>
                                    <h1 className="text-2xl font-medium mb-4">Você está quase lá...</h1>
                                    <p className="text-gray-400">
                                        Para concluir sua compra, basta seguir os passos abaixo e realizar o pagamento. O processo é
                                        rápido e seguro, e você será redirecionado automaticamente após a confirmação.
                                    </p>
                                </div>

                                {/* Info Payment */}
                                <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">ID da transação:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-24 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.id}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Data da transação:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-44 items-center" />
                                        ) : (
                                            <span className="items-center">
                                                {new Intl.DateTimeFormat('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                }).format(new Date(paymentInfo.date))} às {new Intl.DateTimeFormat('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }).format(new Date(paymentInfo.date))}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Status da transação: </span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-20 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.status == "approved" ? "Aprovado" : paymentInfo.status == "pending" ? "Pendente" : "Pendente"}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center">
                                        <span className="text-gray-500 mr-1">Plano Selecionado:</span>
                                        {isLoading ? (
                                            <Skeleton className="h-4 w-16 items-center" />
                                        ) : (
                                            <span className="items-center"> {paymentInfo.plan}</span>
                                        )}
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                                    <Card className="bg-transparent w-[240px] md:w-[280px] flex justify-start">
                                        {isLoading ? (
                                            <Skeleton className="w-full aspect-square" />
                                        ) : (
                                            <img
                                                src={paymentInfo.QRImage || "https://upload.wikimedia.org/wikipedia/commons/3/31/MM_QRcode.png"}
                                                alt="QR Code para pagamento PIX"
                                                className="w-full aspect-square rounded-lg"
                                                width={500}
                                                height={500}
                                            />
                                        )}
                                    </Card>

                                    {/* Steps */}
                                    <div className="space-y-2">
                                        <div className="flex flex-col space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#171922] text-white rounded-full">
                                                    1
                                                </div>
                                                <span className="flex-grow text-gray-300 text-[14px]">Abra o aplicativo do seu banco e acesse a área de pagamento via PIX.</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#171922] text-white rounded-full">
                                                    2
                                                </div>
                                                <span className="flex-grow text-gray-300 text-[14px]">Escolha a opção de pagar com QR Code e escaneie o código ao lado.</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#171922] text-white rounded-full">
                                                    3
                                                </div>
                                                <span className="flex-grow text-gray-300 text-[14px]">Confirme os detalhes da transação e realize o pagamento.</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-[#171922] text-white rounded-full">
                                                    4
                                                </div>
                                                <span className="flex-grow text-gray-300 text-[14px]">Aguarde cerca de 15 segundos, e você será redirecionado para a página de confirmação.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Copiar Código Pix */}
                                <div className="space-y-2 mt-4">
                                    {isLoading ? (
                                        <Skeleton className="p-3 h-[64px] rounded text-sm break-all"
                                            style={{
                                                maskImage: 'linear-gradient(to top, transparent, rgba(7,8,12,255))',
                                                WebkitMaskImage: 'linear-gradient(to top, transparent, rgba(7,8,12,255))'
                                            }} />
                                    ) : (
                                        <div
                                            className="p-3 payment-card rounded text-xs break-all h-[64px] overflow-hidden"
                                            style={{
                                                maskImage: 'linear-gradient(to top, transparent, rgba(7,8,12,255))',
                                                WebkitMaskImage: 'linear-gradient(to top, transparent, rgba(7,8,12,255))',
                                                fontFamily: 'monospace'
                                            }}>
                                            {paymentInfo.QRCode}
                                            <span className="text-gray-500 text-xs block mt-2">
                                                Fonte: br.gov.bcb.pix
                                            </span>
                                        </div>
                                    )}

                                    <Button variant="default" className="w-full md:w-auto nebula-button text-white" disabled={isLoading} onClick={() => {
                                        navigator.clipboard.writeText(paymentInfo.QRCode).then(() => {
                                            setIsCopied(true);
                                            setTimeout(() => setIsCopied(false), 1500);
                                        });
                                    }}>
                                        {isCopied ? <Check className="w-4 h-4 mr-2 icon-pulse" /> : <Copy className="w-4 h-4 mr-2 animate-bounce-x" />}
                                        {isCopied ? "Copiado" : "Copiar código Pix"}
                                    </Button>
                                </div>

                            </div>

                            {/* Direita - Right */}
                            <div className="payment-card bg-[#11131b] w-full max-w-md p-6 px-6 space-y-5 text-white rounded-lg flex-col items-center self-start md:flex hidden">
                                <div className="space-y-2 text-center">
                                    <h2 className="text-sm text-gray-400">Valor à pagar</h2>
                                    {isLoading ? (
                                        <div className="flex justify-center">
                                            <Skeleton className="h-9 w-36 text-3xl font-semibold" />
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-semibold"> R${paymentInfo.price.toFixed(2)}</div>
                                    )}
                                    <div className="flex items-center justify-center gap-1.5 text-sm text-green-500">
                                        <Lock className="w-4 h-4 icon-pulse" />
                                        <span>Pagamento Seguro</span>
                                    </div>
                                </div>
                                <div className="nebula-separator"></div>
                                <div className="text-center text-sm text-gray-400">
                                    <p>O pagamento expira em 15 minutos. Certifique-se de concluir o pagamento dentro desse período.</p>
                                </div>
                            </div>

                        </div>
                    )}

                </div>
            </section >

            {/* Dialog - Payment Error */}
            {isDialogPaymentError && (
                <AlertDialog open={isDialogPaymentError} onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    setIsDialogPaymentError(open);
                    if (!open) {
                        window.location.reload();
                    };
                }}>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <AlertDialogContent className="max-w-md w-full rounded-lg shadow-lg bg-[rgba(7,8,12,255)] payment-container">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-glow">Falha no Processamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Não foi possível processar sua solicitaão no momento. Por favor, atualize a página ou tente novamente mais tarde.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="nebula-button" onClick={() => setIsDialogPaymentError(false)}>Fechar</AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </div>
                </AlertDialog>
            )}

            {/* Dialog - Account Error */}
            {isDialogAccountError && (
                <AlertDialog open={isDialogAccountError} onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    setIsDialogAccountError(open);
                    if (!open) {
                        window.location.reload();
                    };
                }}>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <AlertDialogContent className="max-w-md w-full rounded-lg shadow-lg bg-[rgba(7,8,12,255)] payment-container">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-glow">Conta Incorreta</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta compra foi iniciada com uma conta diferente. Por favor, faça login com a conta utilizada durante o processo de pagamento.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="nebula-button" onClick={() => setIsDialogAccountError(false)}>Fechar</AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </div>
                </AlertDialog>
            )}

            {/* Dialog - Create Machine Error */}
            {isDialogMachineError && (
                <AlertDialog open={isDialogMachineError} onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
                    setIsDialogMachineError(open);
                    if (!open) { window.location.reload(); };
                }}>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <AlertDialogContent className="max-w-md w-full rounded-lg shadow-lg bg-[rgba(7,8,12,255)] payment-container">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-glow">Erro na Criação da Máquina</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Houve um problema ao criar sua máquina virtual. Nossa equipe técnica foi notificada e está trabalhando na solução. Por favor, entre em contato com nosso suporte.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="nebula-button" onClick={() => setIsDialogMachineError(false)}>Fechar</AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </div>
                </AlertDialog>
            )}

        </div>
    );
};