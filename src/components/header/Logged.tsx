'use client';

import { useState, useEffect } from 'react';
import { User } from 'next-auth';
import { LayoutDashboard, Users, Shield, LogOut } from 'lucide-react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LoggedProps {
    user: User;
}

export default function LoggedComponent({ user }: LoggedProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isAdmin = user?.email === 'thecripz8@gmail.com';
    const [shouldOpenDialog, setShouldOpenDialog] = useState(false);
    const [adminId, setAdminId] = useState('');
    const [adminName, setAdminName] = useState('');
    const { toast } = useToast();
    const [showAdminsDialog, setShowAdminsDialog] = useState(false);
    const [admins, setAdmins] = useState<{user_id: string, user_name: string}[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);

    const handleAddAdmin = async () => {
        if (!adminId || !adminName) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Preencha o nome e o ID do admin.',
                variant: 'destructive',
            });
            return;
        }
        try {
            const res = await fetch('/api/admin/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: adminId, user_name: adminName })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: 'Sucesso', description: 'Admin adicionado com sucesso!' });
                setShouldOpenDialog(false);
                setAdminId('');
                setAdminName('');
            } else {
                toast({ title: 'Erro', description: data.message || 'Erro ao adicionar admin', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Erro', description: 'Erro ao adicionar admin', variant: 'destructive' });
        }
    };

    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const res = await fetch('/api/admin/getAll');
            const data = await res.json();
            setAdmins(Array.isArray(data) ? data : []);
        } catch {
            setAdmins([]);
        }
        setLoadingAdmins(false);
    };

    useEffect(() => {
        if (showAdminsDialog) fetchAdmins();
    }, [showAdminsDialog]);

    if (!isLoading) {
        return (
            <>
                {/* Dropdown Menu */}
                <div className="pl-5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40 backdrop-blur-sm">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                    <Image
                                        src={user?.image || '/darkcloud.png'}
                                        alt={user?.name || 'User Avatar'}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-white">{user?.name}</span>
                                    <span className="text-xs text-gray-400">{user?.email}</span>
                                </div>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-72 p-1 bg-[rgba(7,8,12,255)]">
                            <div className="space-y-1 px-1">
                                <DropdownMenuItem 
                                    onClick={() => {
                                        // Redirecionar para o app
                                        window.location.href = 'https://app.darkcloud.store/';
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

                                {/* Admin Menu */}
                                {isAdmin && (
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger className="mb-0.5 cursor-pointer text-blue-500 focus:bg-blue-500/10 data-[state=open]:bg-blue-500/10">
                                            <Shield />
                                            Administração
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent className="p-1 space-y-1 bg-[rgba(7,8,12,255)]">
                                                {/* Dashboard Admin */}
                                                <DropdownMenuItem 
                                                    className="cursor-pointer" 
                                                    onClick={() => {
                                                        window.location.href = '/admin';
                                                    }}
                                                >
                                                    <LayoutDashboard />
                                                    Painel de Administração
                                                </DropdownMenuItem>
                                                {/* Novo botão: Gerenciar Planos */}
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        window.location.href = '/plans-management';
                                                    }}
                                                >
                                                    <Users />
                                                    Gerenciar Planos
                                                </DropdownMenuItem>
                                                {/* Novo botão: Adicionar Admin (abre modal) */}
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => setShouldOpenDialog(true)}
                                                >
                                                    <Shield />
                                                    Adicionar Admin
                                                </DropdownMenuItem>
                                                {/* Novo botão: Ver Admins (abre modal) */}
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() => setShowAdminsDialog(true)}
                                                >
                                                    <Users />
                                                    Ver Admins
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                )}

                                <DropdownMenuSeparator />

                                {/* Logout */}
                                <DropdownMenuItem
                                    onClick={() => signOut()}
                                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-red-500/10 hover:to-pink-500/10 focus:bg-white/5 transition-all group"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                                        <LogOut className="w-4 h-4 text-red-400" />
                                    </div>
                                    <span className="text-white/80 group-hover:text-white transition-colors">Sair</span>
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {/* Dialog para adicionar admin - FORA do DropdownMenu */}
                <Dialog open={shouldOpenDialog} onOpenChange={setShouldOpenDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar novo Admin</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="ID do Admin"
                                value={adminId}
                                onChange={e => setAdminId(e.target.value)}
                            />
                            <Input
                                placeholder="Nome do Admin"
                                value={adminName}
                                onChange={e => setAdminName(e.target.value)}
                            />
                            <Button onClick={handleAddAdmin} className="w-full">Adicionar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
                {/* Dialog para ver admins - FORA do DropdownMenu */}
                <Dialog open={showAdminsDialog} onOpenChange={setShowAdminsDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Lista de Administradores</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {loadingAdmins ? (
                                <div>Carregando...</div>
                            ) : admins.length === 0 ? (
                                <div>Nenhum admin encontrado.</div>
                            ) : (
                                admins.map((admin, idx) => (
                                    <div key={admin.user_id + idx} className="border-b border-muted py-2">
                                        <div className="font-semibold">{admin.user_name}</div>
                                        <div className="text-xs text-muted-foreground">ID: {admin.user_id}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return null;
}