'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'next-auth';
import { LayoutDashboard, Users, Shield, Settings } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LoggedProps {
    user: User;
}

export default function LoggedComponent({ user }: LoggedProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isAdmin = user?.email === 'thecripz8@gmail.com';

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
                                            <Shield className="mr-2 h-4 w-4" />
                                            Administração
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent className="p-1 space-y-1 bg-[rgba(7,8,12,255)]">
                                                {/* Dashboard Admin */}
                                                <DropdownMenuItem 
                                                    className="cursor-pointer flex items-center" 
                                                    onClick={() => {
                                                        window.location.href = '/admin';
                                                    }}
                                                >
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    Painel de Administração
                                                </DropdownMenuItem>

                                                {/* AI Config */}
                                                <DropdownMenuItem 
                                                    className="cursor-pointer flex items-center" 
                                                    onClick={() => {
                                                        window.location.href = '/admin/ai-config';
                                                    }}
                                                >
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Configurar IA
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                )}

                                <DropdownMenuSeparator />

                                {/* Logout */}
                                <DropdownMenuItem
                                    onClick={() => {
                                        window.location.href = '/api/auth/signout';
                                    }}
                                    className="cursor-pointer text-red-500 hover:text-red-400 focus:text-red-400"
                                >
                                    Sair
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </>
        );
    }

    return null;
}