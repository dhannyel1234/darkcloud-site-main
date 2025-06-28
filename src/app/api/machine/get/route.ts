import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// controllers
import machineController from '@/functions/database/controllers/MachineController';
import adminController from '@/functions/database/controllers/AdminController';

async function sendMaliciousAccessWebhook(request: NextRequest, session: any, machineName: string) {
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
            description: "Tentativa de acesso não autorizado a máquina",
            color: 0xFF0000,
            fields: [
                {
                    name: "👤 Usuário Malicioso",
                    value: `${session.user?.name || 'N/A'} (${session.user?.id || 'N/A'})`,
                    inline: true
                },
                {
                    name: "🖥️ Máquina Alvo",
                    value: machineName,
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
                    support: "@dump.ts"
                },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const name = url.searchParams.get("name");
        if (!name) {
            return NextResponse.json(
                {
                    message: "Nome da máquina não encontrado nos parâmetros",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        }

        // Verifica se o usuário é admin
        const isAdmin = await adminController.find({ user_id: session.user.id });

        // Busca a máquina no banco para verificar o proprietário
        const machine = await machineController.find({ name });
        if (!machine) {
            return NextResponse.json(
                {
                    error: "Máquina não encontrada",
                    support: "@dump.ts"
                },
                { status: 404 }
            );
        }

        // Se não for admin, verifica se a máquina pertence ao usuário
        if (!isAdmin && machine.ownerId !== session.user.id) {
            // Registra tentativa maliciosa
            await sendMaliciousAccessWebhook(req, session, name);
            
            return NextResponse.json(
                {
                    error: "Acesso não autorizado"
                },
                { status: 403 }
            );
        }

        return NextResponse.json(machine, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when fetching machine",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};