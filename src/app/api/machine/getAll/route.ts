import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// controllers
import machineController from '@/functions/database/controllers/MachineController';
import adminController from '@/functions/database/controllers/AdminController';

async function sendMaliciousAccessWebhook(request: NextRequest, session: any) {
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
            description: "Tentativa de acesso não autorizado à lista de todas as máquinas",
            color: 0xFF0000,
            fields: [
                {
                    name: "👤 Usuário Malicioso",
                    value: `${session.user?.name || 'N/A'} (${session.user?.id || 'N/A'})`,
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
        const session = await getServerSession();
        if (!session || !session.user?.id) {
            return NextResponse.json(
                {
                    error: "Conta não autenticada.",
                },
                { status: 401 }
            );
        }

        // Verifica se o usuário é admin
        const isAdmin = await adminController.find({ user_id: session.user.id });
        if (!isAdmin) {
            // Registra tentativa maliciosa
            await sendMaliciousAccessWebhook(req, session);
            
            return NextResponse.json(
                {
                    error: "Acesso não autorizado. Apenas administradores podem listar todas as máquinas.",
                    support: "@dump.ts"
                },
                { status: 403 }
            );
        }
        
        const dbAllMachines = await machineController.findAll();
        return NextResponse.json(dbAllMachines, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when fetching machines",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};