'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';

import { User } from "next-auth";
import { signOut } from "next-auth/react";

import { useState, useEffect } from "react";
import { DiscordLogoIcon } from "@radix-ui/react-icons";

import {
    Settings,
    Shield,
    LogOut,
    ChevronDown,
    Box,
    KeyRound,
    UserPlus,
    Users,
    User2,
    Trash2,
    FileText,
    LayoutDashboard,
    Receipt,
    ShieldCheck,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSubTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaRegUser } from "react-icons/fa";
import { FaCrown } from "react-icons/fa6";


export default function LoggedComponent({ user }: { user: User }) {
    const { id, name, email, image } = user || {};

    // router
    const router = useRouter();

    // founders (discord ids)
    const foundersId = [
        "1282104462433058830", // Wesley
        "971901593328967730" // OTA
    ];

    // toast
    const { toast } = useToast();

    // dialog - errors
    const [isDialog_EditStock, setDialog_EditStock] = useState(false);

    // dialog - functions
    const [isDialog_AddAdm, setDialog_AddAdm] = useState(false);
    const [isDialog_ViewAdms, setDialog_ViewAdms] = useState(false);

    const [isStockQuantity_Input, setStockQuantity_Input] = useState(0);
    const [isStockQuantity, setStockQuantity] = useState(0);

    const [isListAdmins, setListAdmins] = useState<Array<{ user_id: string, user_name: string }>>([]);

    const [isAdminName, setAdminName] = useState("");
    const [isAdminId, setAdminId] = useState(0);

    const [isLoading_ViewAdmins, setLoading_ViewAdmins] = useState(true);
    const [isLoading_AddAdmin, setLoading_AddAdmin] = useState(false);
    const [isLoading_EditStock, setLoading_EditStock] = useState(false);

    const [isAdmin, setAdmin] = useState(false);
    const [isLoading, setLoading] = useState(false);
    useEffect(() => {
        const checkAll = async () => {
            try {
                const response = await fetch(`/api/admin/get?user_id=${id}`);
                const data = await response.json();
                if (!data.message) {
                    const response = await fetch(`/api/stock/get`);
                    const data = await response.json();
                    setStockQuantity(data.stock.quantity);

                    setAdmin(true);
                    return setLoading(false);
                }
            } catch (error) {
                // Silently handle the error if the admin API doesn't exist
                console.log('Admin check failed, likely not an admin user');
            }
        };

        if (id) {
            checkAll();
        }
    }, [id]); // Only run when id changes

    const handleMenuButton = async (id: string) => {
        if (id === "add_adm") {
            return setDialog_AddAdm(true);
        } else if (id === "view_adms") {
            setLoading_ViewAdmins(true);
            setDialog_ViewAdms(true);

            const resListAdmin = await fetch(`/api/admin/getAll`);
            const dataListAdmin = await resListAdmin.json();
            if (!dataListAdmin.message) {
                setListAdmins(dataListAdmin);
                return setLoading_ViewAdmins(false);
            };
        };
    };

    const removeAdmin = async (id: string) => {
        await fetch('/api/admin/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: id }),
        });
    };

    if (!isLoading) {
        return (
            <>
{/* Dropdown Menu */}
<div className="pl-5">
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40 backdrop-blur-sm">
                <Image
                    src={image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt="Avatar"
                    width={40}
                    height={40}
                    className="rounded-xl ring-2 ring-white/10 transition-all duration-300"
                    priority
                />
                <ChevronDown className="w-4 h-4 text-white/60 transition-transform duration-300 group-hover:rotate-180" />
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
            align="end" 
            className="w-80 p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95"
        >
            <DropdownMenuLabel className="text-white/80 font-medium px-2 flex items-center gap-2">
                <FaRegUser className="w-4 h-4 text-purple-400" />
                Minha Conta
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10 my-2" />
            
            {/* User Profile Section */}
            <div className="p-4 m-1 flex items-start gap-4 rounded-xl hover:bg-white/5 transition-all duration-300 backdrop-blur-sm border border-white/5">
                <div className="relative">
                    <Image
                        src={image || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        alt="Avatar"
                        width={50}
                        height={50}
                        className="rounded-xl ring-2 ring-purple-500/30"
                        priority
                    />
                    {isAdmin && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full ring-2 ring-black" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">{name}</p>
                        <span className="text-xs text-white/40 shrink-0">#{id}</span>
                    </div>
                    <p className="text-xs text-white/50 truncate">{email}</p>
                    {isAdmin && (
                        <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                            foundersId.includes(id) 
                                ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300'
                                : 'bg-purple-500/20 text-purple-300'
                        }`}>
                            {foundersId.includes(id) ? (
                                <>
                                    <FaCrown className="w-3 h-3" />
                                    Fundador
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-3 h-3" />
                                    Administrador
                                </>
                            )}
                        </span>
                    )}
                </div>
            </div>

            <DropdownMenuSeparator className="bg-white/10 my-2" />
            
            {/* Menu Items */}
            <div className="space-y-1 px-1">
                <DropdownMenuItem 
                  onClick={() => {
                    // Armazenar estado de navegação para evitar problemas de carregamento
                    localStorage.setItem('navigatingToDashboard', 'true');
                    
                    // Usar window.location para navegação direta
                    window.location.href = '/dashboard';
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-indigo-500/10 focus:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <LayoutDashboard className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-white/80 group-hover:text-white transition-colors">Painel de Controle</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = '/queue';
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 focus:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white/80 group-hover:text-white transition-colors">Entrar na fila</span>
                </DropdownMenuItem>

                                {/* Admin [Menu] */}
                                {isAdmin && (
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="mb-0.5 cursor-pointer text-blue-500 focus:bg-blue-500/10 data-[state=open]:bg-blue-500/10">
                                            <Shield />
                                            Administração
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent className="p-1 space-y-1 bg-[rgba(7,8,12,255)]">

                                                {/* Dashboard Admin [Route] */}
                                                <DropdownMenuItem 
                                                  className="cursor-pointer" 
                                                  onClick={() => {
                                                    // Armazenar estado de navegação para evitar problemas de carregamento
                                                    localStorage.setItem('navigatingToAdmin', 'true');
                                                    
                                                    // Usar window.location para navegação direta
                                                    window.location.href = '/admin';
                                                  }}
                                                >
                                                    <LayoutDashboard />
                                                    Painel de Administração
                                                </DropdownMenuItem>

                                                {/* Gerenciar Estoque [Menu] */}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger className="mb-0.5 cursor-pointer">
                                                        <Box />
                                                        Gerenciar Estoque
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent className="p-1 space-y-1 bg-[rgba(7,8,12,255)]">
                                                            <DropdownMenuLabel className="font-light">Estoque ({isStockQuantity})</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />

                                                            {/* Editar Estoque [Estoque] */}
                                                            <DropdownMenuItem className="focus:bg-transparent" onSelect={(e: any) => e.preventDefault()} onFocus={(e: any) => e.stopPropagation()}>
                                                                <div className="w-full flex flex-col gap-2">
                                                                    <Input id="id" placeholder="Novo estoque" type="number" disabled={isLoading_EditStock}
                                                                        onChange={(e) => { setStockQuantity_Input(Number(e.target.value)) }}
                                                                    />
                                                                    <Button variant="default" className="w-full" disabled={isLoading_EditStock}
                                                                        onClick={async () => {
                                                                            if (isNaN(isStockQuantity_Input) || isStockQuantity_Input < 0) {
                                                                                return toast({
                                                                                    title: "Estoque",
                                                                                    description: `Por favor, insira uma quantidade válida para o estoque.`
                                                                                });
                                                                            };

                                                                            setLoading_EditStock(true);

                                                                            const EditStock = async () => {
                                                                                const response = await fetch('/api/stock/edit', {
                                                                                    method: 'POST',
                                                                                    headers: {
                                                                                        'Content-Type': 'application/json',
                                                                                    },
                                                                                    body: JSON.stringify({ quantity: isStockQuantity_Input }),
                                                                                });

                                                                                const data = await response.json();
                                                                                if (!data.message) {
                                                                                    toast({
                                                                                        title: "Estoque",
                                                                                        description: `Estoque atualizado com sucesso para ${isStockQuantity_Input}.`
                                                                                    });

                                                                                    setStockQuantity_Input(0);
                                                                                    setStockQuantity(isStockQuantity_Input);
                                                                                    return setLoading_EditStock(false);
                                                                                } else {
                                                                                    toast({
                                                                                        title: "Estoque",
                                                                                        description: `Erro ao atualizar a quantidade de estoque.`
                                                                                    });

                                                                                    setStockQuantity_Input(0);
                                                                                    return setLoading_EditStock(false);
                                                                                };
                                                                            };

                                                                            await EditStock();
                                                                        }}>
                                                                        {isLoading_EditStock ? (
                                                                            <span className="flex items-center justify-center">
                                                                                <svg className="animate-spin h-5 w-5 mx-7" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                </svg>
                                                                            </span>
                                                                        ) : (
                                                                            "Confirmar"
                                                                        )}
                                                                    </Button>
                                                                    <Button variant="destructive" className="w-full" disabled={isLoading_EditStock}
                                                                        onClick={async () => {
                                                                            setLoading_EditStock(true);

                                                                            const RemoveStock = async () => {
                                                                                const response = await fetch('/api/stock/edit', {
                                                                                    method: 'POST',
                                                                                    headers: {
                                                                                        'Content-Type': 'application/json',
                                                                                    },
                                                                                    body: JSON.stringify({ quantity: 0 }),
                                                                                });

                                                                                const data = await response.json();
                                                                                if (!data.message) {
                                                                                    toast({
                                                                                        title: "Estoque",
                                                                                        description: `Estoque removido com sucesso!`
                                                                                    });

                                                                                    return setLoading_EditStock(false);
                                                                                } else {
                                                                                    toast({
                                                                                        title: "Estoque",
                                                                                        description: `Erro ao remover o estoque.`
                                                                                    });

                                                                                    return setLoading_EditStock(false);
                                                                                };
                                                                            };

                                                                            await RemoveStock();
                                                                        }}>
                                                                        {isLoading_EditStock ? (
                                                                            <span className="flex items-center justify-center">
                                                                                <svg className="animate-spin h-5 w-5 mx-7" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                                                </svg>
                                                                            </span>
                                                                        ) : (
                                                                            "Remover Estoque"
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </DropdownMenuItem>

                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>

                                                {/* Gerenciar Administradores [Menu] */}
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger className="mb-0.5 cursor-pointer">
                                                        <KeyRound />
                                                        Gerenciar Administradores
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent className="p-1 space-y-1 bg-[rgba(7,8,12,255)]">
                                                            <DropdownMenuLabel className="font-light">Administração</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />

                                                            {/* Adicionar [Administração] */}
                                                            <DropdownMenuItem className="mb-0.5 cursor-pointer"
                                                                onClick={() => { handleMenuButton("add_adm") }}>
                                                                <UserPlus />
                                                                Adicionar
                                                            </DropdownMenuItem>

                                                            {/* Ver Administradores [Administração] */}
                                                            <DropdownMenuItem className="mb-0.5 cursor-pointer"
                                                                onClick={() => { handleMenuButton("view_adms") }}>
                                                                <Users />
                                                                Ver Administradores
                                                            </DropdownMenuItem>

                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>

                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                )}

                                {/* Logout */}
                                <DropdownMenuItem className="cursor-pointer text-red-500 focus:bg-red-500/20"
                                    onClick={() => {
                                        localStorage.removeItem('session');
                                        return signOut({ callbackUrl: '/' })
                                    }}
                                >
                                    <LogOut />
                                    Fazer logout
                                </DropdownMenuItem>

                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Dialog - Edit Stock [Error] */}
                {isDialog_EditStock && (
                    <AlertDialog open={isDialog_EditStock}>
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <AlertDialogContent className="max-w-md w-full rounded-lg shadow-lg bg-[rgba(7,8,12,255)]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Erro ao editar estoque</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Ocorreu um erro ao tentar editar o estoque de planos disponíveis. Por favor, tente novamente mais tarde.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDialog_EditStock(false)}>Fechar</AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </div>
                    </AlertDialog>
                )}

                {/* Dialog - Add Admin [Function] */}
                {isDialog_AddAdm && (
                    <Dialog open={isDialog_AddAdm} onOpenChange={() => {
                        { !isLoading_AddAdmin && (setDialog_AddAdm(!isDialog_AddAdm)) }
                    }}>
                        <DialogContent className="sm:max-w-[450px] bg-[rgba(7,8,12,255)]">
                            <DialogHeader>
                                <DialogTitle className="tracking-wide font-normal text-xl">Adicionar Administrador</DialogTitle>
                                <DialogDescription>
                                    Insíra as informações do usuário que será adicionado como administrador.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-1">
                                <div className="items-center">
                                    <div className="flex items-center mb-1">
                                        <User2 className="h-5 w-5 mr-2" />
                                        <span className="text-right">Nome</span>
                                    </div>
                                    <Input id="name" placeholder="Digite um apelido para o usuário" maxLength={36}
                                        onChange={(e) => { setAdminName(e.target.value) }}
                                    />
                                </div>
                                <div className="items-center">
                                    <div className="flex items-center mb-1">
                                        <DiscordLogoIcon className="h-5 w-5 mr-2" />
                                        <span className="text-right whitespace-nowrap">ID do Usuário</span>
                                    </div>
                                    <Input id="id" placeholder="Insira o ID do Discord do usuário" type="number"
                                        onChange={(e) => { setAdminId(Number(e.target.value)) }}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" disabled={isLoading_AddAdmin} onClick={() => {
                                    { !isLoading_AddAdmin && (setDialog_AddAdm(!isDialog_AddAdm)) }
                                }}>Cancelar</Button>
                                <Button variant="default" disabled={isLoading_AddAdmin}
                                    onClick={async () => {
                                        if (isAdminName == "" || isAdminId == 0) {
                                            return toast({
                                                title: "Administração",
                                                description: `Adicione um nome ou ID para o administrador.`
                                            });
                                        };

                                        setLoading_AddAdmin(true);

                                        const createAdmin = async () => {
                                            const response = await fetch('/api/admin/create', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({ user_id: isAdminId, user_name: isAdminName }),
                                            });

                                            const data = await response.json();
                                            if (!data.message) {
                                                toast({
                                                    title: "Administração",
                                                    description: `Administrador ${isAdminName} adicionado com sucesso.`
                                                });

                                                setAdminName("");
                                                setAdminId(0);
                                                setLoading_AddAdmin(false);
                                                return setDialog_AddAdm(false);
                                            } else {
                                                toast({
                                                    title: "Administração",
                                                    description: `Ocorreu um erro ao adicionar o administrador.`
                                                });

                                                setAdminName("");
                                                setAdminId(0);
                                                setLoading_AddAdmin(false);
                                                return setDialog_AddAdm(false);
                                            };
                                        };

                                        await createAdmin();
                                    }}>
                                    {isLoading_AddAdmin ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-5 w-5 mx-7" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        </span>
                                    ) : (
                                        "Adicionar"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog >
                )}

                {/* Dialog - View Admins [Function] */}
                {isDialog_ViewAdms && (
                    <AlertDialog open={isDialog_ViewAdms} onOpenChange={() => { setDialog_ViewAdms(!isDialog_ViewAdms) }}>
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <AlertDialogContent className="max-w-md w-full rounded-lg shadow-lg bg-[rgba(7,8,12,255)]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-normal">Administradores ({isListAdmins.length})</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {isLoading_ViewAdmins ? (
                                            <span className="flex flex-col gap-y-2">
                                                {/* 1 */}
                                                <span className="flex items-center justify-between bg-[#13151f] p-2.5 rounded-lg">
                                                    <span className="flex flex-col items-start gap-y-2">
                                                        <span className="h-5 w-16 bg-primary/10 rounded-md animate-pulse" />
                                                        <span className="h-4 w-40 bg-primary/10 rounded-md animate-pulse" />
                                                    </span>
                                                    <span className="h-10 w-10 bg-primary/10 rounded-md animate-pulse" />
                                                </span>
                                                {/* 2 */}
                                                <span className="flex items-center justify-between bg-[#13151f] p-2.5 rounded-lg">
                                                    <span className="flex flex-col items-start gap-y-2">
                                                        <span className="h-5 w-16 bg-primary/10 rounded-md animate-pulse" />
                                                        <span className="h-4 w-40 bg-primary/10 rounded-md animate-pulse" />
                                                    </span>
                                                    <span className="h-10 w-10 bg-primary/10 rounded-md animate-pulse" />
                                                </span>
                                                {/* 3 */}
                                                <span className="flex items-center justify-between bg-[#13151f] p-2.5 rounded-lg">
                                                    <span className="flex flex-col items-start gap-y-2">
                                                        <span className="h-5 w-16 bg-primary/10 rounded-md animate-pulse" />
                                                        <span className="h-4 w-40 bg-primary/10 rounded-md animate-pulse" />
                                                    </span>
                                                    <span className="h-10 w-10 bg-primary/10 rounded-md animate-pulse" />
                                                </span>
                                                {/* 4 */}
                                                <span className="flex items-center justify-between bg-[#13151f] p-2.5 rounded-lg">
                                                    <span className="flex flex-col items-start gap-y-2">
                                                        <span className="h-5 w-16 bg-primary/10 rounded-md animate-pulse" />
                                                        <span className="h-4 w-40 bg-primary/10 rounded-md animate-pulse" />
                                                    </span>
                                                    <span className="h-10 w-10 bg-primary/10 rounded-md animate-pulse" />
                                                </span>
                                            </span>
                                        ) : (
                                            isListAdmins.length > 0 ? (
                                                <span className="flex flex-col gap-y-2">
                                                    {isListAdmins.sort((a, b) => {
                                                        if (a.user_id === id) return -1;
                                                        if (b.user_id === id) return 1;
                                                        if (foundersId.includes(a.user_id) && !foundersId.includes(b.user_id)) return -1;
                                                        if (!foundersId.includes(a.user_id) && foundersId.includes(b.user_id)) return 1;
                                                        return 0;
                                                    }).map((admin) => (
                                                        <span key={admin.user_id} className="flex items-center justify-between bg-[#13151f] p-2.5 rounded-lg">
                                                            <span className="flex flex-col items-start">
                                                                <span className="block text-sm font-medium">{admin.user_name}</span>
                                                                <span className="block text-xs text-gray-500">{admin.user_id}</span>
                                                            </span>

                                                            {id === admin.user_id ? (
                                                                <span className="flex items-center text-gray-500">Você</span>
                                                            ) : foundersId.includes(admin.user_id) ? (
                                                                <span className="flex items-center text-gray-500">Fundador(a)</span>
                                                            ) : (
                                                                <span className="flex items-center">
                                                                    <Trash2 className="h-5 w-5 cursor-pointer text-red-500 hover:text-red-600 transition-all duration-300"
                                                                        onClick={async () => {
                                                                            await removeAdmin(admin.user_id);
                                                                            return await handleMenuButton("view_adms");
                                                                        }} />
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Nenhum administrador encontrado.</span>
                                            )
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <Button variant="ghost" onClick={() => setDialog_ViewAdms(false)}>
                                        Fechar
                                    </Button>
                                    <Button variant="default" onClick={() => { setDialog_ViewAdms(false); setDialog_AddAdm(true); }}>
                                        Adicionar
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </div>
                    </AlertDialog >
                )}
            </>
        );
    };
};