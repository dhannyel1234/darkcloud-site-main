'use client';

import { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from "react";

import { debounce } from "lodash";
import { motion } from 'framer-motion';
import { format, differenceInDays } from "date-fns";

import {
    Server,
    Power,
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
    Settings,
    UserCheck,
    UserMinus,
    PackagePlus,
    Scaling,
    Trash2
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
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
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import QueueTab from '@/components/admin/QueueTab/index';

export default function Dashboard() {
    const { toast } = useToast();
    const router = useRouter();

    const [machines, setMachines] = useState<any[]>([]);
    const [filteredMachines, setFilteredMachines] = useState<any[]>([]);

    const [updating, setUpdating] = useState<string[]>([]);

    // Dialog [Infos]
    const [isDialogUserID, setDialogUserId] = useState('');
    const [isDialogDays, setDialogDays] = useState(0);
    const [isDialogPlan, setDialogPlan] = useState('Semanal');

    // Dialog [Create Machine]
    const [isDialogMachineName, setDialogMachineName] = useState('');
    const [isDialogMachineSize, setDialogMachineSize] = useState('Standard_NC4as_T4_v3'); // default
    const [isDialogMachineSnapshot, setDialogMachineSnapshot] = useState<{ id: string, name: string }>({ id: '', name: '' });

    // Dialogs [Open]
    const [isDialogCMachine, setDialogCMachine] = useState(false);
    const [isDialogAssociate, setDialogAssociate] = useState(false);
    const [isDialogDAssociate, setDialogDAssociate] = useState(false);
    const [isDialogPUpdate, setDialogPUpdate] = useState(false);
    const [isADialogDelete, setADialogDelete] = useState(false);

    const [isCreatingMachine, setCreatingMachine] = useState(false);
    const [isCreatingMachineProgress, setCreatingMachineProgress] = useState(0);
    const [isCreatedMachine, setCreatedMachine] = useState(false);

    interface Snapshot { id: string; name: string; };
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

    const [isSearch, setSearch] = useState('');
    const [session, setSession] = useState<Session | null>(null);

    const [isLoadingMachines, setLoadingMachines] = useState(true);
    const [isLoading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('machines');

    useEffect(() => {
        const allFetch = async () => {
            try {
                const checkSession = async () => {
                    const cachedSession = localStorage.getItem('session');
                    if (cachedSession) {
                        const parsedSession = JSON.parse(cachedSession);
                        setSession(parsedSession);
                        setLoading(false);
                        return parsedSession;
                    } else {
                        const newSession = await getSession();
                        if (newSession) {
                            setSession(newSession);
                            setLoading(false);
                            localStorage.setItem('session', JSON.stringify(newSession));
                            return newSession;
                        } else {
                            signIn('discord', { redirect: true });
                            return null;
                        }
                    }
                };

                const currentSession = await checkSession();
                if (!currentSession) return;

                const checkAdmin = async () => {
                    const response = await fetch(`/api/admin/get?user_id=${currentSession.user.id}`);
                    const data = await response.json();
                    if (data.message) {
                        return router.push('/');
                    };
                };

                const checkMachines = async () => {
                    const response = await fetch(`/api/azure/getAll`);
                    const machinesAzure = await response.json();
                    const machinesArray = Array.isArray(machinesAzure) ? machinesAzure : [];
                    const machines = await Promise.all(
                        machinesArray.map(async (machine: any) => {
                            const responseMachines = await fetch(`/api/machine/get?name=${machine?.vmInfo.name}`);
                            const dataMachines = await responseMachines.json();
                            if (dataMachines && !dataMachines.message) {
                                const dateFormatted = format(new Date(dataMachines?.plan.expirationDate), "d/M/yyyy 'às' HH:mm");
                                const daysExpire = new Date(dataMachines?.plan.expirationDate) >= new Date() ? differenceInDays(new Date(dataMachines?.plan.expirationDate), new Date()) : 0;
                                return {
                                    name: machine?.vmInfo?.name,
                                    surname: dataMachines?.surname,
                                    plan: { expiration: dateFormatted.toString(), daysRemaining: daysExpire.toString(), name: dataMachines?.plan.name },
                                    connect: { user: dataMachines?.connect.user, password: dataMachines?.connect.password },
                                    associate: dataMachines?.ownerId ?? "Ninguém",
                                    openedInvoice: dataMachines?.openedInvoice,
                                    ip: machine.publicIp || 'Não encontrado',
                                    status: machine.powerState && machine.powerState[1] && machine.powerState[1].code
                                        ? machine.powerState[1].code.replace('PowerState/', '')
                                        : 'deallocated',
                                    image: machine.vmInfo.storageProfile.osDisk.osType || "Não encontrado",
                                    host: dataMachines?.host
                                };
                            } else {
                                return {
                                    name: machine?.vmInfo?.name,
                                    surname: machine?.vmInfo?.name,
                                    plan: { expiration: "Não expira", daysRemaining: "0", name: "Nenhum plano" },
                                    connect: { user: "nebulahost.gg", password: "NebulaCloud2025@" },
                                    associate: "Ninguém",
                                    openedInvoice: false,
                                    ip: machine.publicIp || 'Não encontrado',
                                    status: machine.powerState && machine.powerState[1] && machine.powerState[1].code
                                        ? machine.powerState[1].code.replace('PowerState/', '')
                                        : 'deallocated',
                                    image: machine.vmInfo.storageProfile.osDisk.osType || "Não encontrado",
                                    host: "azure"
                                };
                            };
                        })
                    );

                    setMachines(machines);
                    setLoadingMachines(false);
                };

                await checkAdmin();
                await checkMachines();
            } catch (err) {
                return toast({
                    title: `Erro`,
                    description: `Ocorreu um erro inesperado: ${err}`
                });
            };
        };
        const snapshotsFetch = async () => {
            const response = await fetch('/api/azure/snapshot/getAll');
            const data = await response.json();
            setSnapshots(Array.isArray(data) ? data : []);
        };

        allFetch();
        snapshotsFetch();
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search') || "";
        setSearch(searchParam);

        const filtered = searchParam
            ? machines.filter((machine) => machine.name.toLowerCase().includes(searchParam.toLowerCase()))
            : machines;
        setFilteredMachines(filtered);
    }, [machines, isSearch]);

    // Refresh machines [Handle]
    const handleRefresh = useCallback(async () => {
        setLoadingMachines(true);

        const response = await fetch(`/api/azure/getAll`);
        const machinesAzure = await response.json();
        const machinesArray = Array.isArray(machinesAzure) ? machinesAzure : [];
        const machines = await Promise.all(
            machinesArray.map(async (machine: any) => {
                const responseMachines = await fetch(`/api/machine/get?name=${machine?.vmInfo.name}`);
                const dataMachines = await responseMachines.json();
                if (dataMachines && !dataMachines.message) {
                    const dateFormatted = format(new Date(dataMachines?.plan.expirationDate), "d/M/yyyy 'às' HH:mm");
                    const daysExpire = new Date(dataMachines?.plan.expirationDate) >= new Date() ? differenceInDays(new Date(dataMachines?.plan.expirationDate), new Date()) : 0;
                    return {
                        name: machine?.vmInfo?.name,
                        surname: dataMachines?.surname,
                        plan: { expiration: dateFormatted.toString(), daysRemaining: daysExpire.toString(), name: dataMachines?.plan.name },
                        connect: { user: dataMachines?.connect.user, password: dataMachines?.connect.password },
                        associate: dataMachines?.ownerId ?? "Ninguém",
                        openedInvoice: dataMachines?.openedInvoice,
                        ip: machine.publicIp || 'Não encontrado',
                        status: machine.powerState && machine.powerState[1] && machine.powerState[1].code
                            ? machine.powerState[1].code.replace('PowerState/', '')
                            : 'deallocated',
                        image: machine.vmInfo.storageProfile.osDisk.osType || "Não encontrado",
                        host: dataMachines?.host
                    };
                } else {
                    return {
                        name: machine?.vmInfo?.name,
                        surname: machine?.vmInfo?.name,
                        plan: { expiration: "Não expira", daysRemaining: "0", name: "Nenhum plano" },
                        connect: { user: "nebulahost.gg", password: "NebulaCloud2025@" },
                        associate: "Ninguém",
                        openedInvoice: false,
                        ip: machine.publicIp || 'Não encontrado',
                        status: machine.powerState && machine.powerState[1] && machine.powerState[1].code
                            ? machine.powerState[1].code.replace('PowerState/', '')
                            : 'deallocated',
                        image: machine.vmInfo.storageProfile.osDisk.osType || "Não encontrado",
                        host: "azure"
                    };
                };
            })
        );

        setMachines(machines);
        setLoadingMachines(false);
    }, []);

    // Refresh specific machine [Handle]
    const handleRefreshMachine = async (index: number, name: string) => {
        try {
            const response = await fetch(`/api/machine/get?name=${name}`);
            const dataMachines = await response.json();

            const responseAzure = await fetch(`/api/azure/get?name=${name}`);
            const dataAzure = await responseAzure.json();

            if (dataMachines && dataAzure && !dataMachines.message) {
                const dateFormatted = format(new Date(dataMachines?.plan.expirationDate), "d/M/yyyy 'às' HH:mm");
                const daysExpire = new Date(dataMachines?.plan.expirationDate) >= new Date() ? differenceInDays(new Date(dataMachines?.plan.expirationDate), new Date()) : 0;
                setFilteredMachines((prevMachines) => {
                    const updatedMachines = [...prevMachines];
                    updatedMachines[Number(index)] = {
                        ...updatedMachines[Number(index)],
                        status: dataAzure.powerState && dataAzure.powerState[1] && dataAzure.powerState[1].code
                            ? dataAzure.powerState[1].code.replace('PowerState/', '')
                            : 'deallocated',
                        plan: {
                            expiration: dateFormatted.toString(),
                            daysRemaining: daysExpire.toString(),
                            name: dataMachines?.plan.name
                        },
                        associate: dataMachines?.ownerId ?? "Ninguém",
                        openedInvoice: dataMachines?.openedInvoice
                    };
                    return updatedMachines;
                });
            } else {
                setFilteredMachines((prevMachines) => {
                    const updatedMachines = [...prevMachines];
                    updatedMachines[Number(index)] = {
                        ...updatedMachines[Number(index)],
                        status: dataAzure.powerState && dataAzure.powerState[1] && dataAzure.powerState[1].code
                            ? dataAzure.powerState[1].code.replace('PowerState/', '')
                            : 'deallocated',
                        plan: {
                            expiration: "Não expira",
                            daysRemaining: "0",
                            name: "Nenhum plano"
                        },
                        associate: "Ninguém",
                        openedInvoice: false
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

    // Create machine [Handle]
    const [progressMessage, setProgressMessage] = useState("Iniciando a criação da máquina virtual...");
    const handleCreateMachine = async (name: string, size: string, snapshotId: string) => {
        setCreatingMachineProgress(0);
        setProgressMessage("Iniciando a criação da máquina virtual...");
        setCreatingMachine(true);
        setCreatedMachine(false);

        const messages = [
            "Preparando...",
            "Liberando as portas de segurança...",
            "Configurando a rede virtual...",
            "Estabelecendo a rede da máquina...",
            "Implantando o disco na máquina...",
            "Finalizando a implantação..."
        ];

        let currentMessageIndex = 0;
        const progressInterval = setInterval(() => {
            if (currentMessageIndex < messages.length) {
                setProgressMessage(messages[currentMessageIndex]);
                setCreatingMachineProgress(((currentMessageIndex + 1) / messages.length) * 90);
                currentMessageIndex++;
            } else {
                clearInterval(progressInterval);
            };
        }, 8000); // 8s

        const resMachine = await fetch('/api/azure/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                vmSize: size,
                userId: session?.user.id,
                snapshotId
            }),
        });

        setTimeout(async () => {
            setCreatingMachineProgress(100);
            setCreatingMachine(false);
            setCreatedMachine(true);
            setProgressMessage("Máquina virtual criada com sucesso!");
            setDialogCMachine(false);
            setUpdating((prev) => prev.filter((index) => index !== name));
            toast({
                title: "Sucesso na Implantação",
                description: `Máquina ${name} implantada com sucesso no painel.`
            });

            const data = await resMachine.json();
            console.log(data);

            await handleRefresh();
            return clearInterval(progressInterval);
        }, 50000); // 50s
    };

    // Delete machine [Handle]
    const handleDeleteMachine = async (name: string) => {
        const responseMachine = await fetch('/api/azure/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        if (responseMachine.ok) {
            setADialogDelete(false);
            setUpdating((prev) => prev.filter((index) => index !== name));
            toast({
                title: "Remoção Concluída",
                description: `A máquina ${name} foi removida com sucesso do painel.`
            });

            return await handleRefresh();
        } else {
            setUpdating((prev) => prev.filter((index) => index !== name));
            return toast({
                title: "Erro ao Remover",
                description: `Houve um problema ao tentar remover a máquina ${name} do painel.`
            });
        };
    };

    // Search machine [Change]
    const handleSearchChange = useCallback(
        debounce((value: string) => {
            const valueFinal = value.replace(/ /g, '+');
            if (valueFinal === '+' || valueFinal === '') {
                setFilteredMachines(machines);
                router.push(`/dashboard/admin`);
            } else {
                const filtered = machines.filter((machine) =>
                    machine.name.toLowerCase().includes(valueFinal.toLowerCase())
                );

                setFilteredMachines(filtered);
                router.push(`/admin?search=${valueFinal}`);
            };
        }, 500),
        [machines]
    );

    // Search machine [Input]
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
        handleSearchChange(event.target.value);
    };

    // Change Tab [Machines]
    const handleTabChange = (value: string) => {
        if (value === 'machines') {
            router.push('/dashboard/admin');
        };
    };

    // Copy [IP]
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(text);
        setTimeout(() => setCopiedIndex(null), 1000); // 1 second
    };

    return (
        <div className="min-h-full w-screen flex flex-col text-white lg:mb-16">

            {/* Main Section */}
            <section className="flex-grow relative px-7 pt-28 lg:pt-32" style={{ minHeight: '100vh' }}>
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Router */}
                    <nav className="flex items-center space-x-2 text-sm text-gray-400">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Painel de Controle</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Máquinas</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Administração</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </nav>

                    {/* Title */}
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-normal">Olá, </h1>
                            {isLoading ? (
                                <Skeleton className="h-7 w-28 ml-2" />
                            ) : (
                                <span className="ml-2 text-2xl font-normal">{session?.user.name}</span>
                            )}
                        </div>
                        <p className="text-gray-400">
                            Este é o painel de administração de máquinas. Aqui você pode gerenciar todas as máquinas criadas, associá-las aos clientes e realizar diversas outras configurações.
                        </p>
                    </div>

                    {/* Options */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-transparent border-b border-gray-800 w-full justify-start h-auto p-0 space-x-4">
                            <TabsTrigger value="machines" className="bg-transparent px-0 pb-3 ml-2 rounded-none">Máquinas</TabsTrigger>
                            <TabsTrigger value="filas" className="bg-transparent px-0 pb-3 ml-2 rounded-none">Filas</TabsTrigger>
                        </TabsList>

                        {/* Content [Animate] */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <TabsContent value="machines" className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <Input
                                        placeholder="Procure por uma máquina"
                                        className="bg-[#151823] border-gray-800"
                                        value={isSearch}
                                        onChange={handleInputChange}
                                        maxLength={38}
                                        disabled={isLoadingMachines}
                                    />

                                    {/* Refresh - Button */}
                                    <Button variant="default" onClick={handleRefresh} disabled={isLoadingMachines}
                                        className="flex items-center space-x-1 transition text-gray-300 bg-gray-500/15 border-[1px] border-gray-500 hover:bg-gray-500/50 hover:text-white">
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>

                                    {/* Create Machine - Button */}
                                    <Dialog onOpenChange={setDialogCMachine}>
                                        <DialogTrigger asChild>
                                            <Button variant="default" disabled={isLoadingMachines}
                                                className="flex items-center space-x-1 transition text-gray-300 bg-gray-500/15 border-[1px] border-gray-500 hover:bg-gray-500/50 hover:text-white">
                                                <PackagePlus className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[450px] bg-[rgba(7,8,12,255)]">
                                            <DialogHeader>
                                                <DialogTitle className="tracking-wide font-normal text-xl">Implantar Máquina</DialogTitle>
                                                <DialogDescription>
                                                    Forneça as informações da máquina que será implantada.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-1">
                                                {/* Name */}
                                                <div className="items-center">
                                                    <div className="flex items-center mb-1">
                                                        <Server className="h-5 w-5 mr-2" />
                                                        <span className="text-right">Nome da Máquina</span>
                                                    </div>
                                                    <Input id="id" value={isDialogMachineName !== '' ? isDialogMachineName : ''} disabled={updating.includes(isDialogMachineName)}
                                                        placeholder="Insira um nome para a máquina" type="text"
                                                        maxLength={18}
                                                        onChange={(e) => { setDialogMachineName(e.target.value) }}
                                                    />
                                                </div>
                                                {/* Size */}
                                                <div className="items-center">
                                                    <div className="flex items-center mb-1">
                                                        <Scaling className="h-5 w-5 mr-2" />
                                                        <span className="text-right whitespace-nowrap">Tamanho (T4)</span>
                                                    </div>
                                                    <Select value={isDialogMachineSize} disabled={updating.includes(isDialogMachineName)}
                                                        onValueChange={setDialogMachineSize}>
                                                        <SelectTrigger className="w-full mb-2">
                                                            <SelectValue placeholder="Selecione um Tamanho" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup className="bg-[#10111782]">
                                                                <SelectItem value="Standard_NC4as_T4_v3">4 núcleos</SelectItem>
                                                                <SelectItem value="Standard_NC8as_T4_v3">8 núcleos</SelectItem>
                                                                <SelectItem value="Standard_NC16as_T4_v3">16 núcleos</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {/* Snapshot */}
                                                <div className="items-center">
                                                    <div className="flex items-center mb-1">
                                                        <Scaling className="h-5 w-5 mr-2" />
                                                        <span className="text-right whitespace-nowrap">Imagem</span>
                                                    </div>
                                                    <Select disabled={updating.includes(isDialogMachineName)}
                                                        onValueChange={(value) => {
                                                            const selectedSnapshot = snapshots.find((snapshot) => snapshot.id === value);
                                                            if (selectedSnapshot) {
                                                                setDialogMachineSnapshot({ id: selectedSnapshot.id, name: selectedSnapshot.name });
                                                            };
                                                        }}>
                                                        <SelectTrigger className="w-full mb-2">
                                                            <SelectValue placeholder="Selecione uma Imagem (snapshot)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup className="bg-[#10111782]">
                                                                {Array.isArray(snapshots) && snapshots.map((snapshot, index) => (
                                                                    <SelectItem key={index} value={snapshot.id}>
                                                                        {snapshot.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {/* Progress */}
                                                <motion.div initial={{ opacity: 0 }}
                                                    animate={{ opacity: isCreatingMachine || isCreatedMachine ? 1 : 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    {(isCreatingMachine || isCreatedMachine) && (
                                                        <div className="items-center space-y-1">
                                                            <Progress value={isCreatingMachineProgress} className="h-2 bg-[#24262e]" />
                                                            <p className={`text-sm ${isCreatingMachine ? "text-sm text-gray-400 animate-pulse" : isCreatedMachine ? "text-green-400" : "text-red-400"}`}>
                                                                {progressMessage || (isCreatedMachine ? "Máquina virtual criada com sucesso!" : "Erro ao criar a máquina virtual.")}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose>Cancelar</DialogClose>
                                                <Button variant="default" disabled={updating.includes(isDialogMachineName)}
                                                    onClick={async () => {
                                                        if (isDialogMachineName === '' || isDialogMachineName.length < 8 || isDialogMachineSnapshot.id === '') {
                                                            return toast({
                                                                title: "Administração",
                                                                description: `Adicione as informações necessárias para implantar uma máquina.`
                                                            });
                                                        };

                                                        // Set Loading
                                                        setUpdating((prev) => [...prev, isDialogMachineName]);

                                                        // Webhook [Log]
                                                        await fetch('/api/webhook/log', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                data: {
                                                                    "embeds": [
                                                                        {
                                                                            "author": {
                                                                                "name": `${session?.user.name} - ${session?.user.id}`,
                                                                                "icon_url": session?.user.image
                                                                            },
                                                                            "title": `Implantando Máquina`,
                                                                            "description": `**Nome:** ${isDialogMachineName}\n**Tamanho:** ${isDialogMachineSize === "Standard_NC4as_T4_v3" ? "4 núcleos" : isDialogMachineSize === "Standard_NC8as_T4_v3" ? "8 núcleos" : "16 núcleos"}\n**Imagem:** ${isDialogMachineSnapshot.name}`,
                                                                            "color": 13882323,
                                                                            "footer": { "text": "@nebulahost.gg" },
                                                                            "timestamp": new Date().toISOString()
                                                                        }
                                                                    ]
                                                                }
                                                            }),
                                                        });

                                                        // Function
                                                        await handleCreateMachine(isDialogMachineName, isDialogMachineSize, isDialogMachineSnapshot.id);
                                                    }}>
                                                    {updating.includes(isDialogMachineName) ? (
                                                        <span className="flex items-center justify-center">
                                                            <svg className="animate-spin h-5 w-5 mx-7" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                            </svg>
                                                        </span>
                                                    ) : (
                                                        "Implantar"
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {isLoadingMachines ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[...Array(6)].map((_, index) => (
                                            <div key={index} className="bg-[#151823] rounded-lg shadow-lg">
                                                <div className="py-2 pl-4">
                                                    <Skeleton className="h-6 w-56" />
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
                                ) : filteredMachines.length === 0 ? (
                                    <div className="flex items-center justify-center h-[200px] text-gray-400">
                                        Nenhuma máquina encontrada
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredMachines.map((machine, index) => (
                                            <div key={index} className="bg-[#151823] rounded-lg shadow-lg">
                                                <div className="py-2 pl-4 flex justify-between items-center">
                                                    <h3 className="text-lg font-normal text-white flex items-center">
                                                        <Server className="w-5 h-5 text-gray-400 mr-2" />
                                                        {machine.name}
                                                    </h3>

                                                    {/* Machine [Admin - Dropdown] */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger>
                                                            <div className="mr-3 cursor-pointer">
                                                                <Settings className="w-5 h-5 text-white" />
                                                            </div>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="p-1 bg-[#11131c]">
                                                            <DropdownMenuLabel className="font-light">{machine.name}</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuGroup className="p-0.5 space-y-1">

                                                                {/* Associate */}
                                                                <Dialog onOpenChange={setDialogAssociate}>
                                                                    <DialogTrigger asChild>
                                                                        <div className="flex items-center cursor-pointer p-2 hover:bg-accent transition duration-200 ease-in-out rounded-lg w-[320px]">
                                                                            <UserCheck className="ml-2 mr-3 h-5 w-5" />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-normal text-sm">Associar Máquina</span>
                                                                                <span className="text-gray-400 text-xs">Associe a máquina a um usuário.</span>
                                                                            </div>
                                                                        </div>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[450px] bg-[rgba(7,8,12,255)]">
                                                                        <DialogHeader>
                                                                            <DialogTitle className="tracking-wide font-normal text-xl">Associar Máquina</DialogTitle>
                                                                            <DialogDescription>
                                                                                Forneça as informações do usuário que será associado à máquina {machine.name}.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="grid gap-4 py-1">
                                                                            <div className="items-center">
                                                                                <div className="flex items-center mb-1">
                                                                                    <User className="h-5 w-5 mr-2" />
                                                                                    <span className="text-right">ID do Usuário</span>
                                                                                </div>
                                                                                <Input id="id" disabled={updating.includes(index.toString())} placeholder="Insira o ID do Discord do usuário" type="number"
                                                                                    onChange={(e) => { setDialogUserId(e.target.value) }}
                                                                                />
                                                                            </div>
                                                                            <div className="items-center">
                                                                                <div className="flex items-center mb-1">
                                                                                    <Hourglass className="h-5 w-5 mr-2" />
                                                                                    <span className="text-right whitespace-nowrap">Dias do Plano</span>
                                                                                </div>
                                                                                <Input id="id" disabled={updating.includes(index.toString())} placeholder="Insira a quantidade de dias restantes no plano" type="number"
                                                                                    onChange={(e) => { setDialogDays(Number(e.target.value)) }}
                                                                                />
                                                                            </div>
                                                                            <div className="items-center">
                                                                                <div className="flex items-center mb-1">
                                                                                    <Tag className="h-5 w-5 mr-2" />
                                                                                    <span className="text-right whitespace-nowrap">Plano</span>
                                                                                </div>
                                                                                <Select value={isDialogPlan} disabled={updating.includes(index.toString())} onValueChange={setDialogPlan}>
                                                                                    <SelectTrigger className="w-full mb-2">
                                                                                        <SelectValue placeholder="Selecione um Plano" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectGroup className="bg-[#10111782]">
                                                                                            <SelectItem value="Semanal">Semanal</SelectItem>
                                                                                            <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                                                                                            <SelectItem value="Mensal">Mensal</SelectItem>
                                                                                        </SelectGroup>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <DialogClose>Cancelar</DialogClose>
                                                                            <Button variant="default" disabled={updating.includes(index.toString())}
                                                                                onClick={async () => {
                                                                                    if (isDialogUserID === '' || isDialogDays === 0) {
                                                                                        return toast({
                                                                                            title: "Administração",
                                                                                            description: `Adicione as informações necessárias para associar está máquina.`
                                                                                        });
                                                                                    };

                                                                                    // Set Loading
                                                                                    setUpdating((prev) => [...prev, index.toString()]);

                                                                                    // Webhook [Log]
                                                                                    await fetch('/api/webhook/log', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({
                                                                                            data: {
                                                                                                "embeds": [
                                                                                                    {
                                                                                                        "author": {
                                                                                                            "name": `${session?.user.name} - ${session?.user.id}`,
                                                                                                            "icon_url": session?.user.image
                                                                                                        },
                                                                                                        "title": `Associando Máquina`,
                                                                                                        "description": `**Máquina:** ${machine.name}\n**Associado:** <@${isDialogUserID}> | ${isDialogUserID}\n**Dias Restantes:** ${isDialogDays}\n**Plano:** ${isDialogPlan}`,
                                                                                                        "color": 13882323,
                                                                                                        "footer": { "text": "@nebulahost.gg" },
                                                                                                        "timestamp": new Date().toISOString()
                                                                                                    }
                                                                                                ]
                                                                                            }
                                                                                        }),
                                                                                    });

                                                                                    // Function
                                                                                    const associateUser = async () => {
                                                                                        try {
                                                                                            const response = await fetch('/api/machine/create', {
                                                                                                method: 'POST',
                                                                                                headers: {
                                                                                                    'Content-Type': 'application/json',
                                                                                                },
                                                                                                body: JSON.stringify({
                                                                                                    name: machine.name,
                                                                                                    surname: machine.surname,
                                                                                                    host: machine.host,
                                                                                                    userId: isDialogUserID,
                                                                                                    days: isDialogDays,
                                                                                                    plan: isDialogPlan
                                                                                                })
                                                                                            });

                                                                                            const data = await response.json();
                                                                                            if (!data.message) {
                                                                                                await handleRefreshMachine(index, machine.name);

                                                                                                setDialogAssociate(false);
                                                                                                setUpdating((prev) => prev.filter((index) => index !== index.toString()));
                                                                                                return toast({
                                                                                                    title: "Associação Concluida",
                                                                                                    description: `Máquina ${machine.name} associada com sucesso ao usuário ID ${isDialogUserID}.`
                                                                                                });
                                                                                            } else {
                                                                                                toast({
                                                                                                    title: "Erro na Associação",
                                                                                                    description: `Ocorreu um erro ao tentar associar a máquina ${machine.name} ao usuário ID ${isDialogUserID}.`
                                                                                                });

                                                                                                return setUpdating((prev) => prev.filter((index) => index !== index.toString()));
                                                                                            };

                                                                                        } catch (err) {
                                                                                            toast({
                                                                                                title: `Erro de Processamento da API`,
                                                                                                description: `Erro ao processar a resposta da API para a máquina ${machine.name}.`,
                                                                                            });

                                                                                            return setUpdating((prev) => prev.filter((index) => index !== index.toString()));
                                                                                        };
                                                                                    };

                                                                                    await associateUser();
                                                                                }}>
                                                                                {updating.includes(index.toString()) ? (
                                                                                    <span className="flex items-center justify-center">
                                                                                        <svg className="animate-spin h-5 w-5 mx-7" viewBox="0 0 24 24">
                                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                        </svg>
                                                                                    </span>
                                                                                ) : (
                                                                                    "Associar"
                                                                                )}
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>

                                                                {/* Plan [Update] */}
                                                                <Dialog onOpenChange={setDialogPUpdate}>
                                                                    <DialogTrigger asChild>
                                                                        <div className="flex items-center cursor-pointer p-2 hover:bg-accent transition duration-200 ease-in-out rounded-lg w-[320px]">
                                                                            <RefreshCw className="ml-1.5 mr-3.5 h-5 w-5" />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-normal text-sm">Atualizar Plano</span>
                                                                                <span className="text-gray-400 text-xs">Atualize o plano da máquina.</span>
                                                                            </div>
                                                                        </div>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[450px] bg-[rgba(7,8,12,255)]">
                                                                        <DialogHeader>
                                                                            <DialogTitle className="tracking-wide font-normal text-xl">Atualizar plano</DialogTitle>
                                                                            <DialogDescription>
                                                                                Forneça as novas informações do plano para a máquina {machine.name}.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="grid gap-4 py-1">
                                                                            <div className="items-center">
                                                                                <div className="flex items-center mb-1">
                                                                                    <Hourglass className="h-5 w-5 mr-2" />
                                                                                    <span className="text-right whitespace-nowrap">Dias do Plano</span>
                                                                                </div>
                                                                                <Input id="id" disabled={updating.includes(index.toString())} placeholder="Insira a quantidade de dias do plano" type="number"
                                                                                    onChange={(e) => { setDialogDays(Number(e.target.value)) }}
                                                                                />
                                                                            </div>
                                                                            <div className="items-center">
                                                                                <div className="flex items-center mb-1">
                                                                                    <Tag className="h-5 w-5 mr-2" />
                                                                                    <span className="text-right whitespace-nowrap">Plano</span>
                                                                                </div>
                                                                                <Select value={isDialogPlan} disabled={updating.includes(index.toString())} onValueChange={setDialogPlan}>
                                                                                    <SelectTrigger className="w-full mb-2">
                                                                                        <SelectValue placeholder="Selecione um Plano" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectGroup className="bg-[#10111782]">
                                                                                            <SelectItem value="Semanal">Semanal</SelectItem>
                                                                                            <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                                                                                            <SelectItem value="Mensal">Mensal</SelectItem>
                                                                                        </SelectGroup>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter>
                                                                            <DialogClose>Cancelar</DialogClose>
                                                                            <Button variant="default" disabled={updating.includes(index.toString())}
                                                                                onClick={async () => {

                                                                                    // Set Loading
                                                                                    setUpdating((prev) => [...prev, index.toString()]);

                                                                                    // Webhook [Log]
                                                                                    await fetch('/api/webhook/log', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({
                                                                                            data: {
                                                                                                "embeds": [
                                                                                                    {
                                                                                                        "author": {
                                                                                                            "name": `${session?.user.name} - ${session?.user.id}`,
                                                                                                            "icon_url": session?.user.image
                                                                                                        },
                                                                                                        "title": `Atualizando Plano`,
                                                                                                        "description": `**Máquina:** ${machine.name}\n**Dias:** ${isDialogDays}\n**Plano:** ${isDialogPlan}`,
                                                                                                        "color": 13882323,
                                                                                                        "footer": { "text": "@nebulahost.gg" },
                                                                                                        "timestamp": new Date().toISOString()
                                                                                                    }
                                                                                                ]
                                                                                            }
                                                                                        }),
                                                                                    });

                                                                                    // Function
                                                                                    const updatePlan = async () => {
                                                                                        try {
                                                                                            const response = await fetch('/api/machine/update', {
                                                                                                method: 'POST',
                                                                                                headers: {
                                                                                                    'Content-Type': 'application/json',
                                                                                                },
                                                                                                body: JSON.stringify({
                                                                                                    name: machine.name,
                                                                                                    days: isDialogDays,
                                                                                                    plan: isDialogPlan
                                                                                                })
                                                                                            });

                                                                                            const data = await response.json();
                                                                                            if (!data.message) {
                                                                                                await handleRefreshMachine(index, machine.name);

                                                                                                setDialogPUpdate(false);
                                                                                                setUpdating((prev) => prev.filter((index) => index !== index.toString()));
                                                                                                return toast({
                                                                                                    title: "Atualização Concluida",
                                                                                                    description: `Plano atualizado com sucesso da máquina ${machine.name}.`
                                                                                                });
                                                                                            } else {
                                                                                                toast({
                                                                                                    title: "Erro na Atualização",
                                                                                                    description: `Ocorreu um erro ao tentar atualizar o plano da máquina ${machine.name}.`
                                                                                                });

                                                                                                return setUpdating((prev) => prev.filter((index) => index !== index.toString()));
                                                                                            };

                                                                                        } catch (err) {
                                                                                            toast({
                                                                                                title: `Erro de Processamento da API`,
                                                                                                description: `Erro ao processar a resposta da API para a máquina ${machine.name}.`,
                                                                                            });

                                                                                            return setUpdating((prev) => prev.filter((index) => index !== index.toString()));
                                                                                        };
                                                                                    };

                                                                                    await updatePlan();
                                                                                }}>
                                                                                {updating.includes(index.toString()) ? (
                                                                                    <span className="flex items-center justify-center">
                                                                                        <svg className="animate-spin h-5 w-5 mx-7" viewBox="0 0 24 24">
                                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                        </svg>
                                                                                    </span>
                                                                                ) : (
                                                                                    "Atualizar"
                                                                                )}
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>

                                                                {/* Machine [Delete] */}
                                                                <AlertDialog onOpenChange={setADialogDelete}>
                                                                    <AlertDialogTrigger asChild>
                                                                        <div className={`flex items-center p-2 transition duration-200 ease-in-out rounded-lg w-[320px] ${updating.includes(index.toString()) ? 'opacity-50 cursor-default' : 'hover:bg-red-500/30 cursor-pointer'}`}>
                                                                            <Trash2 className="ml-1.5 mr-3.5 h-5 w-5" />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-normal text-sm">Excluir Máquina</span>
                                                                                <span className="text-gray-400 text-xs">Exclua a máquina do painel.</span>
                                                                            </div>
                                                                        </div>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent className="sm:max-w-[450px] bg-[rgba(7,8,12,255)]">
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle className="font-normal">Você tem certeza absoluta?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Esta ação é irreversível e irá remover permanentemente a máquina do painel.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                            <Button variant="default" disabled={updating.includes(machine.name)}
                                                                                onClick={async () => {

                                                                                    // Set Loading
                                                                                    setUpdating((prev) => [...prev, machine.name]);

                                                                                    // Webhook [Log]
                                                                                    await fetch('/api/webhook/log', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({
                                                                                            data: {
                                                                                                "embeds": [
                                                                                                    {
                                                                                                        "author": {
                                                                                                            "name": `${session?.user.name} - ${session?.user.id}`,
                                                                                                            "icon_url": session?.user.image
                                                                                                        },
                                                                                                        "title": `Deletando Máquina`,
                                                                                                        "description": `**Máquina:** ${machine.name}`,
                                                                                                        "color": 13882323,
                                                                                                        "footer": { "text": "@nebulahost.gg" },
                                                                                                        "timestamp": new Date().toISOString()
                                                                                                    }
                                                                                                ]
                                                                                            }
                                                                                        }),
                                                                                    });

                                                                                    // Function
                                                                                    await handleDeleteMachine(machine.name);
                                                                                }}>
                                                                                {updating.includes(machine.name) ? (
                                                                                    <span className="flex items-center justify-center">
                                                                                        <svg className="animate-spin h-5 w-5 mx-4" viewBox="0 0 24 24">
                                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                        </svg>
                                                                                    </span>
                                                                                ) : (
                                                                                    "Excluir"
                                                                                )}
                                                                            </Button>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>

                                                                {/* Associate [Delete] */}
                                                                <AlertDialog onOpenChange={setDialogDAssociate}>
                                                                    <AlertDialogTrigger asChild>
                                                                        <div className={`flex items-center p-2 transition duration-200 ease-in-out rounded-lg w-[320px] ${updating.includes(index.toString()) ? 'opacity-50 cursor-default' : 'hover:bg-red-500/30 cursor-pointer'}`}>
                                                                            <UserMinus className="ml-2 mr-3.5 h-5 w-5" />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-normal text-sm">Remover Associação</span>
                                                                                <span className="text-gray-400 text-xs">Remova a associação e o plano da máquina.</span>
                                                                            </div>
                                                                        </div>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent className="sm:max-w-[450px] bg-[rgba(7,8,12,255)]">
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle className="font-normal">Você tem certeza absoluta?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Esta ação é irreversível e irá remover permanentemente a associação desta máquina.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                            <Button variant="default" disabled={updating.includes(machine.name)}
                                                                                onClick={async () => {

                                                                                    // Set Loading
                                                                                    setUpdating((prev) => [...prev, machine.name]);

                                                                                    // Webhook [Log]
                                                                                    await fetch('/api/webhook/log', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({
                                                                                            data: {
                                                                                                "embeds": [
                                                                                                    {
                                                                                                        "author": {
                                                                                                            "name": `${session?.user.name} - ${session?.user.id}`,
                                                                                                            "icon_url": session?.user.image
                                                                                                        },
                                                                                                        "title": `Removendo Associação`,
                                                                                                        "description": `**Máquina:** ${machine.name}`,
                                                                                                        "color": 13882323,
                                                                                                        "footer": { "text": "@nebulahost.gg" },
                                                                                                        "timestamp": new Date().toISOString()
                                                                                                    }
                                                                                                ]
                                                                                            }
                                                                                        }),
                                                                                    });

                                                                                    // Function
                                                                                    const removeAssociateUser = async () => {
                                                                                        try {
                                                                                            const response = await fetch('/api/machine/delete', {
                                                                                                method: 'POST',
                                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                                body: JSON.stringify({ name: machine.name })
                                                                                            });

                                                                                            const data = await response.json();
                                                                                            if (!data.message) {
                                                                                                await handleRefreshMachine(index, machine.name);

                                                                                                setDialogDAssociate(false);
                                                                                                setUpdating((prev) => prev.filter((index) => index !== machine.name));
                                                                                                return toast({
                                                                                                    title: "Remoção Concluida",
                                                                                                    description: `Associação removida da máquina ${machine.name}.`
                                                                                                });
                                                                                            } else {
                                                                                                toast({
                                                                                                    title: "Erro na Remoção",
                                                                                                    description: `Ocorreu um erro ao tentar remover a associação da máquina ${machine.name}.`
                                                                                                });

                                                                                                return setUpdating((prev) => prev.filter((index) => index !== machine.name));
                                                                                            };

                                                                                        } catch (err) {
                                                                                            toast({
                                                                                                title: `Erro de Processamento da API`,
                                                                                                description: `Erro ao processar a resposta da API para a máquina ${machine.name}.`,
                                                                                            });

                                                                                            return setUpdating((prev) => prev.filter((index) => index !== machine.name));
                                                                                        };
                                                                                    };

                                                                                    await removeAssociateUser();
                                                                                }}>
                                                                                {updating.includes(machine.name) ? (
                                                                                    <span className="flex items-center justify-center">
                                                                                        <svg className="animate-spin h-5 w-5 mx-4" viewBox="0 0 24 24">
                                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                        </svg>
                                                                                    </span>
                                                                                ) : (
                                                                                    "Remover"
                                                                                )}
                                                                            </Button>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>

                                                                {/* Invoice [Delete] */}
                                                                <div className={`flex items-center p-2 transition duration-200 ease-in-out rounded-lg w-[320px] ${machine.openedInvoice !== true || updating.includes(index.toString()) ? 'opacity-50 cursor-default' : 'hover:bg-accent cursor-pointer'}`}
                                                                    onClick={async () => {
                                                                        if (machine.openedInvoice !== true || updating.includes(index.toString())) return;

                                                                        // Set Loading
                                                                        setUpdating((prev) => [...prev, index.toString()]);

                                                                        // Webhook [Log]
                                                                        await fetch('/api/webhook/log', {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({
                                                                                data: {
                                                                                    "embeds": [
                                                                                        {
                                                                                            "author": {
                                                                                                "name": `${session?.user.name} - ${session?.user.id}`,
                                                                                                "icon_url": session?.user.image
                                                                                            },
                                                                                            "title": `Excluindo Fatura`,
                                                                                            "description": `**Máquina:** ${machine.name}\n**Plano:** ${machine.plan.name}`,
                                                                                            "color": 13882323,
                                                                                            "footer": { "text": "@nebulahost.gg" },
                                                                                            "timestamp": new Date().toISOString()
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            }),
                                                                        });

                                                                        // Function
                                                                        const removeInvoice = async () => {
                                                                            try {
                                                                                await fetch('/api/invoice/remove', {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json', },
                                                                                    body: JSON.stringify({ name: machine.name })
                                                                                });

                                                                                const responsePlan = await fetch('/api/machine/update', {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json', },
                                                                                    body: JSON.stringify({
                                                                                        name: machine.name,
                                                                                        days: machine.plan.name === "Semanal" ? 7 : machine.plan.name === "Quinzenal" ? 15 : machine.plan.name === "Mensal" ? 30 : 30,
                                                                                        plan: machine.plan.name,
                                                                                        invoice: false
                                                                                    })
                                                                                });

                                                                                const dataPlan = await responsePlan.json();
                                                                                if (!dataPlan.message) {
                                                                                    setUpdating((prev) => prev.filter((index) => index !== index.toString()));

                                                                                    await handleRefreshMachine(index, machine.name);
                                                                                    return toast({
                                                                                        title: "Remoção Concluida",
                                                                                        description: `Máquina ${machine.name} renovada com sucesso.`
                                                                                    });
                                                                                } else {
                                                                                    toast({
                                                                                        title: "Erro na Remoção",
                                                                                        description: `Ocorreu um erro ao tentar remover a fatura da máquina ${machine.name}.`
                                                                                    });

                                                                                    return setUpdating((prev) => prev.filter((index) => index !== index.toString()));
                                                                                };

                                                                            } catch (err) {
                                                                                toast({
                                                                                    title: `Erro de Processamento da API`,
                                                                                    description: `Erro ao processar a resposta da API para a máquina ${machine.name}.`,
                                                                                });

                                                                                return setUpdating((prev) => prev.filter((index) => index !== index.toString()));
                                                                            };
                                                                        };

                                                                        await removeInvoice();
                                                                    }}>
                                                                    <div className="flex items-center p-2 transition duration-200 ease-in-out rounded-lg w-[320px] hover:bg-accent cursor-pointer">
                                                                        <Copy className="ml-1.5 mr-3.5 h-5 w-5" />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-normal text-sm">Renovar Fatura</span>
                                                                            <span className="text-gray-400 text-xs">Renove a fatura da máquina.</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Filas Content */}
                            <TabsContent value="filas" className="space-y-6">
                                <QueueTab />
                            </TabsContent>
                        </motion.div>
                    </Tabs>
                </div>
            </section>
        </div>
    );
} 