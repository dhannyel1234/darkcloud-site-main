'use client';

import { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from "react";

import { debounce } from "lodash";
import { motion } from 'framer-motion';
import { format, differenceInDays } from "date-fns";
import { AiOutlinePlusCircle } from "react-icons/ai"; // Novo ícone

import {
    Server,
    Square,
    Play,
    RefreshCw,
    Globe,
    Copy,
    Check,
    Clock,
    Hourglass,
    Tag,
    Link as LinkIcon,
    User,
    LockOpen,
    Power,
    Pencil,
    X,
    ServerOff,
    AlertCircle
} from "lucide-react";

// shadcn
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
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
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GrVirtualMachine } from "react-icons/gr";
import { VscAzure } from "react-icons/vsc";
import { MdOutlineMonitor } from "react-icons/md";


interface EditingState { isEditing: boolean; isLoading: boolean; value: string };
interface EditingStates { [key: number]: EditingState };

export default function Dashboard() {
    const { toast } = useToast();
    const router = useRouter();

    const [machines, setMachines] = useState<any[]>([]);
    const [filteredMachines, setFilteredMachines] = useState<any[]>([]);

    const [isSearch, setSearch] = useState('');
    const [updating, setUpdating] = useState<string[]>([]);
    const [session, setSession] = useState<Session | null>(null);

    const [editingStates, setEditingStates] = useState<EditingStates>({});
    const [isLoadingMachines, setLoadingMachines] = useState(true);
    const [isLoading, setLoading] = useState(true);

    // Atualiza filteredMachines quando machines mudar
    useEffect(() => {
        setFilteredMachines(machines);
    }, [machines]);

    useEffect(() => {
        // Verificar se estamos navegando do cabeçalho e limpar o flag
        const isNavigatingFromHeader = localStorage.getItem('navigatingToDashboard') === 'true';
        if (isNavigatingFromHeader) {
            localStorage.removeItem('navigatingToDashboard');
        }

        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search') || "";

        const allFetch = async () => {
            try {
                const checkSession = async () => {
                    // Tentar obter a sessão do localStorage primeiro
                    const cachedSession = localStorage.getItem('session');
                    if (cachedSession) {
                        try {
                            const parsedSession = JSON.parse(cachedSession);
                            setSession(parsedSession);
                            setLoading(false);
                            return;
                        } catch (e) {
                            // Se houver erro ao analisar a sessão em cache, remover e continuar
                            localStorage.removeItem('session');
                        }
                    }
                    
                    // Se não houver sessão em cache ou houver erro, obter nova sessão
                    const session = await getSession();
                    if (session) {
                        setSession(session);
                        setLoading(false);
                        localStorage.setItem('session', JSON.stringify(session));
                    } else {
                        signIn('discord', { redirect: true });
                    };

                    return;
                };
                const checkMachines = async () => {
                    const cachedSession = localStorage.getItem('session');
                    const jsonSession = cachedSession ? JSON.parse(cachedSession) : session;

                    const response = await fetch(`/api/machine/getAllUser?userId=${jsonSession?.user.id}`);
                    const machinesData = await response.json();

                    const machines = (await Promise.all(
                        machinesData.map(async (machine: any) => {
                            const responseAzure = await fetch(`/api/azure/get?name=${machine.name}`);
                            const dataAzure = await responseAzure.json();
                            if (!dataAzure.message) {
                                return {
                                    name: machine.name,
                                    surname: machine.surname,
                                    expiration: machine.expirationDate,
                                    plan: { expiration: machine.plan.expirationDate, name: machine.plan.name },
                                    connect: { user: machine.connect.user, password: machine.connect.password },
                                    openedInvoice: machine.openedInvoice,
                                    ip: dataAzure.publicIp || 'Não encontrado',
                                    status: dataAzure.powerState && dataAzure.powerState[1] && dataAzure.powerState[1].code
                                        ? dataAzure.powerState[1].code.replace('PowerState/', '')
                                        : 'deallocated',
                                    image: dataAzure.vmInfo.storageProfile.osDisk.osType || "Não encontrado",
                                    host: machine.host,
                                    creating: dataAzure.powerState && dataAzure.powerState[0] && dataAzure.powerState[0].code === 'PowerState/creating'
                                        ? true
                                        : false,
                                };
                            };

                            return null;
                        })
                    )).filter(machine => machine !== null);

                    setMachines(machines);
                    setLoadingMachines(false);
                };

                checkSession();
                checkMachines();

                const filtered = searchParam
                    ? machines.filter((machine) => machine.surname.toLowerCase().includes(searchParam.toLowerCase()))
                    : machines;
                setFilteredMachines(filtered);
            } catch (err) {
                toast({
                    title: `Erro`,
                    description: `Ocorreu um erro inesperado: ${err}`
                });
            };
        };

        allFetch();
    }, [toast]);  // Removed 'machines' from dependency array to prevent infinite API calls

    // Refresh machines [Handle]
    const handleRefresh = async () => {
        setLoadingMachines(true);

        const cachedSession = localStorage.getItem('session');
        const jsonSession = cachedSession ? JSON.parse(cachedSession) : session;

        const response = await fetch(`/api/machine/getAllUser?userId=${jsonSession?.user.id}`);
        const machinesData = await response.json();
        console.log('Initial machines data:', machinesData);

        const machines = (await Promise.all(
            machinesData.map(async (machine: any) => {
                const responseAzure = await fetch(`/api/azure/get?name=${machine.name}`);
                const dataAzure = await responseAzure.json();
                console.log(`Azure response for ${machine.name}:`, dataAzure);
                // Return machine info regardless of Azure data availability
                return {
                    name: machine.name,
                    surname: machine.surname,
                    expiration: machine.expirationDate,
                    plan: { expiration: machine.plan.expirationDate, name: machine.plan.name },
                    connect: { user: machine.connect.user, password: machine.connect.password },
                    openedInvoice: machine.openedInvoice,
                    ip: dataAzure.publicIp || 'Não disponível',
                    status: dataAzure.message ? 'error' : (dataAzure.powerState && dataAzure.powerState[1] && dataAzure.powerState[1].code
                        ? dataAzure.powerState[1].code.replace('PowerState/', '')
                        : 'deallocated'),
                    image: dataAzure.message ? 'Não disponível' : (dataAzure.vmInfo?.storageProfile?.osDisk?.osType || "Não encontrado"),
                    host: machine.host,
                    creating: !dataAzure.message && dataAzure.powerState && dataAzure.powerState[0] && dataAzure.powerState[0].code === 'PowerState/creating',
                    error: dataAzure.message || undefined
                };
            })
        ));

        console.log('Final machines data:', machines);
        setMachines(machines);
        setLoadingMachines(false);
    };

    // Refresh specific machine [Handle]
    const handleRefreshMachine = async (index: string, name: string) => {
        try {
            const response = await fetch(`/api/azure/get?name=${name}`);
            const dataMachines = await response.json();

            if (dataMachines && !dataMachines.message) {
                setMachines((prevMachines) => {
                    const updatedMachines = [...prevMachines];
                    updatedMachines[Number(index)] = {
                        ...updatedMachines[Number(index)],
                        status: dataMachines.powerState && dataMachines.powerState[1] && dataMachines.powerState[1].code
                            ? dataMachines.powerState[1].code.replace('PowerState/', '')
                            : 'deallocated',
                        ip: dataMachines.publicIp || 'Não encontrado',
                        image: dataMachines.vmInfo.storageProfile.osDisk.osType || "Não encontrado",
                    };
                    return updatedMachines;
                });
            };
        } catch (err) {
            toast({
                title: `Erro`,
                description: `Erro ao atualizar informações da máquina: ${err}`
            });
        };
    };

    // Start machine [Handle]
    const handleStart = async (index: string, name: string, host: string) => {
        setUpdating((prev) => [...prev, name]);

        const hostFormatted = host === "azure" ? "Azure" : host === "amazon" ? "AWS" : "Google";
        toast({
            title: `[${hostFormatted}] Iniciando`,
            description: `Iniciando a máquina ${name}.`,
        });

        const response = await fetch(`/api/azure/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        const responseGet = await fetch(`/api/azure/get?name=${name}`);
        const dataGet = await responseGet.json();
        if (dataGet.powerState?.[0]?.code?.includes('OverconstrainedAllocationRequest')) {
            setUpdating((prev) => prev.filter((machineName) => machineName !== name));

            return toast({
                title: `SKU [${hostFormatted}]`,
                description: `Ocorreu um erro de SKU ao tentar iniciar a máquina ${name}. Por favor, tente novamente mais tarde.`,
            });
        };

        const data = await response.json();
        if (!data.error) {
            setUpdating((prev) => prev.filter((machineName) => machineName !== name));

            return await handleRefreshMachine(index, name);
        } else {
            setUpdating((prev) => prev.filter((machineName) => machineName !== name));

            return toast({
                title: `Erro ao iniciar máquina [${hostFormatted}]`,
                description: `Ocorreu um erro ao tentar iniciar a máquina ${name}.`,
            });
        };
    };

    // Stop machine [Handle]
    const handleStop = async (index: string, name: string, host: string) => {
        setUpdating((prev) => [...prev, name]);

        const hostFormatted = host === "azure" ? "Azure" : host === "amazon" ? "AWS" : "Google";
        toast({
            title: `[${hostFormatted}] Parando`,
            description: `Parando a máquina ${name}.`,
        });

        const response = await fetch(`/api/azure/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        const responseGet = await fetch(`/api/azure/get?name=${name}`);
        const dataGet = await responseGet.json();
        if (dataGet.powerState?.[0]?.code?.includes('OverconstrainedAllocationRequest')) {
            setUpdating((prev) => prev.filter((machineName) => machineName !== name));

            return toast({
                title: `SKU [${hostFormatted}]`,
                description: `Ocorreu um erro de SKU ao tentar parar a máquina ${name}. Por favor, tente novamente mais tarde.`,
            });
        };

        const data = await response.json();
        if (!data.error) {
            setUpdating((prev) => prev.filter((machineName) => machineName !== name));

            return await handleRefreshMachine(index, name);
        } else {
            setUpdating((prev) => prev.filter((machineName) => machineName !== name));

            return toast({
                title: `Erro ao parar máquina [${hostFormatted}]`,
                description: `Ocorreu um erro ao tentar parar a máquina ${name}.`,
            });
        };
    };

// Search machine [Change]
const handleSearchChange = useCallback(
    debounce((value: string) => {
        if (value === '+' || value === '') {
            // Não faz nada, mantém na página inicial
            // Pode colocar uma lógica aqui se quiser limpar algum estado, por exemplo.
        } else {
            setLoadingMachines(true);
            // Aqui você pode apenas atualizar o estado ou chamar outra função sem redirecionar.
            setTimeout(() => { setLoadingMachines(false) }, 3000);
        };
    }, 500), // 500ms delay
    []
);

    // Search machine [Input]
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/ /g, '+');
        setSearch(value);
        handleSearchChange(value);
    };

// Change Tab [Invoices only]
const handleTabChange = (value: string) => {
    if (value === 'invoices') {
        router.push('/invoices');
    } else {
        // Não faz nada, mantém na aba atual (não redireciona para outra página)
    };
};

    // Copy [IP]
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(text);
        setTimeout(() => setCopiedIndex(null), 1000); // 1 second
    };

    // Update machine name [Handle]
    const handleMachineNameEdit = async (index: number, machine: any) => {
        // Se não estiver editando, inicia a edição
        if (!editingStates[index]?.isEditing) {
            return setEditingStates(prev => ({
                ...prev,
                [index]: {
                    isEditing: true,
                    isLoading: false,
                    value: machine.surname
                }
            }));
        };

        // Inicia o loading
        setEditingStates(prev => ({
            ...prev,
            [index]: { ...prev[index], isLoading: true }
        }));

        const newName = editingStates[index].value.trim();

        // Validation checks
        if (!newName || newName === machine.surname) {
            setEditingStates(prev => ({
                ...prev,
                [index]: { isEditing: false, isLoading: false, value: machine.surname }
            }));
            return;
        } else if (newName.length < 3) {
            toast({
                title: "Nome inválido",
                description: "O nome deve ter pelo menos 3 caracteres.",
                variant: "destructive",
            });
            setEditingStates(prev => ({
                ...prev,
                [index]: { ...prev[index], isLoading: false }
            }));
            return;
        };

        const validNameRegex = /^[a-zA-Z0-9\s-]+$/;
        if (!validNameRegex.test(newName)) {
            toast({
                title: "Nome inválido",
                description: "Use apenas letras, números, espaços e hífens.",
                variant: "destructive",
            });
            setEditingStates(prev => ({
                ...prev,
                [index]: { ...prev[index], isLoading: false }
            }));
            return;
        };

        try {
            const response = await fetch('/api/machine/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: machine.name,
                    surname: newName
                })
            });

            if (!response.ok) {
                throw new Error('Falha ao atualizar');
            }

            setMachines(prev => prev.map((m, i) =>
                i === index ? { ...m, surname: newName } : m
            ));

            // Reseta o estado após sucesso
            setEditingStates(prev => ({
                ...prev,
                [index]: { isEditing: false, isLoading: false, value: newName }
            }));

        } catch (err) {
            toast({
                title: "Erro",
                description: "Não foi possível atualizar o nome da máquina.",
                variant: "destructive",
            });

            // Mantém em modo de edição em caso de erro
            setEditingStates(prev => ({
                ...prev,
                [index]: { ...prev[index], isLoading: false }
            }));
        }
    };

    return (
        <div className="min-h-full w-screen flex flex-col text-white lg:mb-16">

{/* Main Section */}
<section className="relative flex-grow px-7 pt-28 lg:pt-32 min-h-screen">
  <div className="max-w-6xl mx-auto space-y-8">
    {/* Router */}
    <nav className="flex items-center gap-2 text-sm text-zinc-300 p-3 rounded-lg border border-white/20">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={(e) => e.preventDefault()} className="text-white hover:text-zinc-200 transition-colors">
              Painel de Controle
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-white">
              Máquinas
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </nav>

{/* Welcome Card */}
<div className="rounded-2xl border border-white/10 p-6 shadow-lg space-y-4">
  <div className="flex items-center gap-2">
    <h1 className="text-3xl font-light text-transparent bg-gradient-to-r from-white to-zinc-400 bg-clip-text">
      Olá,
    </h1>
    {isLoading ? (
      <Skeleton className="h-7 w-28" />
    ) : (
      <span className="text-3xl font-light text-transparent bg-gradient-to-r from-sky-200 to-blue-300 bg-clip-text">
        {session?.user.name}
      </span>
    )}
  </div>
  <p className="text-sm text-zinc-300 leading-relaxed">
  Seja bem-vindo ao painel de controle da Dark. Aqui, você pode gerenciar suas máquinas virtuais e acessar informações importantes.
  </p>
</div>


{/* Options */}
<Tabs defaultValue="machines" onValueChange={handleTabChange} className="space-y-6 bg-transparent">
  <TabsList className="border-b border-gray-700 w-full justify-start p-0 space-x-6 bg-transparent">
    <TabsTrigger
      value="machines"
      className="px-0 pb-3 text-lg font-medium text-gray-300 hover:text-white focus:outline-none transition-all hover:border-b-2 hover:border-blue-500 bg-transparent"
    >
      Máquinas
    </TabsTrigger>
  </TabsList>

{/* Content [Animate] */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  <TabsContent value="machines" className="space-y-6">
    <div className="flex items-center gap-3">
    <Input
  placeholder="Busque por uma máquina"
  className="border border-[#3b4752] text-gray-200 focus:ring-2 focus:ring-[#4e5d6c] rounded-lg transition-all"
  value={isSearch}
  onChange={handleInputChange}
  maxLength={38}
  disabled={isLoadingMachines || machines.length < 1}
/>
<Button
  variant="ghost"
  onClick={handleRefresh}
  disabled={isLoadingMachines || machines.length < 1}
  className="flex items-center gap-2 transition-all text-gray-300 hover:bg-gray-600/40 hover:text-white border border-gray-600 rounded-lg p-2 bg-transparent"
>
  <RefreshCw className="w-5 h-5" />
</Button>
    </div>

                                {isLoadingMachines ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[...Array(3)].map((_, index) => (
                                            <div key={index} className="border border-white/10 rounded-lg shadow-lg">
                                                <div className="py-2 px-4">
                                                    <Skeleton className="h-6 w-full" />
                                                </div>

                                                <Separator />

                                                <div className="px-4 pt-4 space-y-2 mb-2">
                                                    {/* Machine [Info] */}
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-4 w-1/3" />
                                                    <Skeleton className="h-4 w-1/4" />
                                                    <Skeleton className="h-4 w-1/3" />

                                                    <Separator className="my-3" />

                                                    {/* Machine [Plan] */}
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-4 w-1/3" />
                                                    <Skeleton className="h-4 w-1/4" />

                                                    {/* Machine [Buttons] */}
                                                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                        <Skeleton className="h-10 w-full" />
                                                        <Skeleton className="h-10 w-full" />
                                                        <Skeleton className="h-10 w-full" />
                                                    </div>
                                                </div>
                                                <div className="px-4 pb-4">
                                                    <Skeleton className="h-10 w-full" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredMachines.length < 1 ? (
                                    <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 text-center px-4">
                                    <GrVirtualMachine className="w-10 h-10 mb-2" />
                                    <span>
                                      Olá! <span className="text-sky-400">{session?.user.name}</span>,<br />
                                      Não encontramos nenhuma máquina.<br />
                                      Caso ache que é um erro, entre em contato com o suporte.
                                    </span>
                              
                                    <button
  onClick={() => router.push("/order")}
  className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl shadow-sm hover:bg-sky-100 hover:shadow-md hover:scale-[1.03] transition-all duration-300"
>
  <AiOutlinePlusCircle className="w-5 h-5 text-sky-600" />
  <span className="font-medium">Ainda não tem assinatura? <span className="text-sky-600">Assine agora!</span></span>
</button>
                                  </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredMachines.map((machine, index) => (
                                            <div key={index} className="border border-white/10 rounded-lg shadow-lg">

                                                <div className="py-2 pl-4">
                                                    <h3 className="text-lg font-normal text-white">
                                                        <div className="flex items-center">
                                                            <MdOutlineMonitor className="w-5 h-5 text-white-400 mr-4" />
                                                            <Input
                                                                value={editingStates[index]?.isEditing ? editingStates[index]?.value : machine?.surname}
                                                                onChange={(e) => setEditingStates(prev => ({
                                                                    ...prev,
                                                                    [index]: { ...prev[index], value: e.target.value }
                                                                }))}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleMachineNameEdit(index, machine);
                                                                    } else if (e.key === 'Escape') {
                                                                        setEditingStates(prev => ({
                                                                            ...prev,
                                                                            [index]: { isEditing: false, isLoading: false, value: machine.surname }
                                                                        }));
                                                                    };
                                                                }}
                                                                disabled={!editingStates[index]?.isEditing || editingStates[index]?.isLoading}
                                                                maxLength={22}
                                                                type="text"
                                                                className="w-8 border border-gray-800 flex-1 text-center"
                                                                />

                                                            <div className="ml-4 mr-4">
                                                                {editingStates[index]?.isLoading ? (
                                                                    <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                                                                ) : editingStates[index]?.isEditing ? (
                                                                    <Check
                                                                        className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors"
                                                                        onClick={() => handleMachineNameEdit(index, machine)}
                                                                    />
                                                                ) : (
                                                                    <Pencil
                                                                        className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors"
                                                                        onClick={() => handleMachineNameEdit(index, machine)}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </h3>
                                                </div>

                                                <Separator />

                                                <div className="p-4">
                                                    {/* Machine Info Cards - Glassmorphism Design */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        {/* Status Card */}
                                                        <div className="border border-white/10 rounded-xl p-4 shadow-lg transition-all">
                                                        <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                                                                        <Power className="w-5 h-5 text-white-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs text-gray-400 font-medium">STATUS</p>
                                                                        <p className="text-sm font-semibold text-white truncate">
                                                                            {machine.openedInvoice === true ? "Fatura em Aberto" : 
                                                                             updating.includes(machine.name) ? "Atualizando" : 
                                                                             machine.creating ? "Criando" : 
                                                                             machine.status === "running" ? "Ligada" : 
                                                                             machine.status === "deallocated" ? "Parada" : "Atualizando"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                

                                                            </div>
                                                        </div>

                                                        {/* Image & Infrastructure Card */}
                                                        <div className="border border-white/10 rounded-xl p-4 shadow-lg transition-all">
                                                        <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-white-500/20 to-blue-500/20 border border-white-500/30">
                                                                    <VscAzure className="w-5 h-5 text-white" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs text-gray-400 font-medium">PLATAFORMA</p>
                                                                        <p className="text-sm font-semibold text-white truncate">
                                                                            {machine.host === "azure" ? "Azure" : machine.host === "amazon" ? "AWS" : "Google"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* IP Address Card */}
                                                    <div className="border border-white/10 rounded-xl p-4 shadow-lg transition-all">
                                                    <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                                <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                                                                <Globe className="w-5 h-5 text-white" />

                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-400 font-medium">IP PÚBLICO</p>
                                                                    <p className="text-sm font-semibold text-white truncate">{machine.ip}</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleCopy(machine.ip)}
                                                                className="flex-shrink-0 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/20 transition-all"
                                                                aria-label="Copiar IP"
                                                            >
                                                                {copiedIndex === machine.ip ? 
                                                                    <Check className="w-4 h-4 text-white-400" /> : 
                                                                    <Copy className="w-4 h-4 text-white-400" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Plan Information Card */}
                                                    <div className="border border-white/10 rounded-xl p-4 shadow-lg transition-all">
                                                    <div className="flex items-center space-x-3 mb-3">
                                                            <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                                                                <Tag className="w-5 h-5 text-white-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-gray-400 font-medium">PLANO</p>
                                                                <p className="text-sm font-semibold text-white truncate">{machine.plan.name}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="flex items-center space-x-2 overflow-hidden">
                                                                <Clock className="flex-shrink-0 w-4 h-4 text-white-400" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-400">Expira em</p>
                                                                    <p className="text-xs font-medium text-white truncate">{format(new Date(machine.plan.expiration), "d/M/yyyy 'às' HH:mm")}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Hourglass className="flex-shrink-0 w-4 h-4 text-white-400" />
                                                                <div>
                                                                    <p className="text-xs text-gray-400">Dias restantes</p>
                                                                    <p className="text-xs font-medium text-white">
                                                                        {new Date(machine.plan.expiration) >= new Date() ? differenceInDays(new Date(machine.plan.expiration), new Date()) : 0} dias
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Machine Control Buttons */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <Button 
    onClick={async () => await handleStart(index.toString(), machine.name, machine.host)}
    disabled={machine.openedInvoice === true || updating.includes(machine.name) || machine.creating || machine.status === "running" || machine.status === "deallocating" || machine.status === "starting"}
    className="flex items-center justify-center gap-2 py-3 transition-all rounded-xl text-white bg-gradient-to-br from-emerald-500 to-green-600 border border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:border-green-700 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-emerald-600/30">

    <div className="flex-shrink-0 p-1 rounded-md bg-white/20">
        <Play className="w-4 h-4 text-white" /> 
    </div>
    <span className="font-medium">Ligar</span>
</Button>
                                                        <Button 
    onClick={async () => await handleStop(index.toString(), machine.name, machine.host)}
    disabled={machine.openedInvoice === true || updating.includes(machine.name) || machine.creating || machine.status === "deallocated" || machine.status === "deallocating" || machine.status === "starting"}
    className="flex items-center justify-center gap-2 py-3 transition-all rounded-xl text-white bg-gradient-to-br from-red-500 to-rose-600 border border-red-600 hover:from-red-600 hover:to-red-700 hover:border-red-700 hover:shadow-xl hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-red-600/30">
    
    <div className="flex-shrink-0 p-1 rounded-md bg-white/20">
        <Square className="w-4 h-4 text-white" /> 
    </div>
    <span className="font-medium">Parar</span>
</Button>
                                                    </div>

{/* Machine [Connect - Dropdown] */}
<DropdownMenu key={index}>
    <DropdownMenuTrigger asChild disabled={machine.openedInvoice === true || updating.includes(machine.name) || machine.creating || machine.status === "deallocated" || machine.status === "deallocating" || machine.status === "starting"}>
        <div className="flex justify-center w-full mt-3">
        <Button 
    variant="default" 
    disabled={machine.openedInvoice === true || updating.includes(machine.name) || machine.creating || machine.status === "deallocated" || machine.status === "deallocating" || machine.status === "starting"}
    className="w-full max-w-[232px] flex items-center justify-center gap-2 py-2 transition-all rounded-lg text-white bg-gradient-to-br from-zinc-700 to-gray-800 border border-gray-700 hover:from-gray-700 hover:to-zinc-900 hover:shadow-lg hover:shadow-zinc-700/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:bg-gray-700/40">
    
    <LinkIcon className="w-4 h-4 text-white" /> 
    <span className="font-medium">Conectar</span>
</Button>
        </div>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="p-1 bg-[#11131c]">
                                                            <DropdownMenuLabel className="font-light">{machine.surname}</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuGroup className="p-0.5">

                                                                {/* Liberação */}
                                                                <DropdownMenuItem className="focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
                                                                    <div className="w-full flex flex-col gap-2">
                                                                        {/* User */}
                                                                        <div className="grid w-full max-w-sm items-center gap-1">
                                                                            <span className="flex items-center">
                                                                                <User className="w-4 h-4 mr-2" />
                                                                                Usuário
                                                                            </span>
                                                                            <div className="flex items-center">
                                                                                <Input id="user" disabled={true} defaultValue={machine.connect.user} className="flex-grow" />
                                                                                <span onClick={() => handleCopy(machine.connect.user)}
                                                                                    className="ml-3 cursor-pointer text-gray-400 hover:text-white transition-colors">
                                                                                    {copiedIndex === machine.connect.user ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Password */}
                                                                        <div className="grid w-full max-w-sm items-center gap-1">
                                                                            <span className="flex items-center">
                                                                                <LockOpen className="w-4 h-4 mr-2" />
                                                                                Senha
                                                                            </span>
                                                                            <div className="flex items-center">
                                                                                <Input id="pass" type="password" disabled={true} defaultValue={machine.connect.password} className="flex-grow" />
                                                                                <span onClick={() => handleCopy(machine.connect.password)}
                                                                                    className="ml-3 cursor-pointer text-gray-400 hover:text-white transition-colors">
                                                                                    {copiedIndex === machine.connect.password ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* IP */}
                                                                        <div className="grid w-full max-w-sm items-center gap-1">
                                                                            <span className="flex items-center">
                                                                                <Globe className="w-4 h-4 mr-2" />
                                                                                IP Público
                                                                            </span>
                                                                            <div className="flex items-center">
                                                                                <Input id="pass" disabled={true} defaultValue={machine.ip} className="flex-grow" />
                                                                                <span onClick={() => handleCopy(machine.ip)}
                                                                                    className="ml-3 cursor-pointer text-gray-400 hover:text-white transition-colors">
                                                                                    {copiedIndex === machine.ip ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </DropdownMenuItem>

                                                            </DropdownMenuGroup>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </motion.div>
                    </Tabs>
                </div>
            </section>

        </div>
    );
};