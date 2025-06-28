import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

// controllers
import machineController from '@/functions/database/controllers/MachineController';

import adminController from '@/functions/database/controllers/AdminController';

async function sendMaliciousAccessWebhook(request: NextRequest, session: any, targetUserId: string) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_SECURITY;
    if (!webhookUrl) return;

    try {
        const now = new Date();
        const brazilTime = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(now);

        const embed = {
            title: "⚠️ Tentativa de Acesso Malicioso Detectada",
            description: "Tentativa de acesso não autorizado a dados de outro usuário",
            color: 0xFF0000,
            fields: [
                {
                    name: "👤 Usuário Malicioso",
                    value: `${session.user?.name || 'N/A'} (${session.user?.id || 'N/A'})`,
                    inline: true
                },
                {
                    name: "🎯 Usuário Alvo",
                    value: targetUserId,
                    inline: true
                },
                {
                    name: "🌐 Rota",
                    value: request.nextUrl.pathname,
                    inline: true
                },
                {
                    name: "⏰ Horário",
                    value: brazilTime,
                    inline: true
                },
                {
                    name: "🌍 IP",
                    value: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'N/A',
                    inline: true
                }
            ],
            timestamp: now.toISOString()
        };

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error('Erro ao enviar webhook de segurança:', error);
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                {
                    error: "Conta não autenticada.",
                    support: "@dump.ts"
                },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const targetUserId = url.searchParams.get("userId");
        if (!targetUserId) {
            return NextResponse.json(
                {
                    message: "ID do usuário não encontrado nos parâmetros",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        }

        // Verifica se o usuário é admin
        const isAdmin = await adminController.find({ user_id: session.user.id });

        // Se não for admin, só pode ver suas próprias máquinas
        if (!isAdmin && targetUserId !== session.user.id) {
            // Registra tentativa maliciosa
            await sendMaliciousAccessWebhook(req, session, targetUserId);
            
            return NextResponse.json(
                {
                    error: "Acesso não autorizado",
                    support: "@dump.ts"
                },
                { status: 403 }
            );
        }

        const dbAllMachines = await machineController.findAllUser({ ownerId: targetUserId });
        return NextResponse.json(dbAllMachines, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Erro ao buscar máquinas do usuário",
                error: err,
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};