import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

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
            description: "Tentativa de criar máquina para outro usuário",
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

export async function POST(req: NextRequest) {
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

        const { name, surname, host, userId, days, plan } = await req.json();
        if (!name || !surname || !userId || !days || !plan ) {
            return NextResponse.json(
                {
                    error: "Parâmetros obrigatórios faltando",
                },
                { status: 400 }
            );
        }

        // Verifica se o usuário é admin
        const isAdmin = await adminController.find({ user_id: session.user.id });

        // Se não for admin, só pode criar máquina para si mesmo
        if (!isAdmin && userId !== session.user.id) {
            // Registra tentativa maliciosa
            await sendMaliciousAccessWebhook(req, session, userId);
            
            return NextResponse.json(
                {
                    error: "Acesso não autorizado.",
                },
                { status: 403 }
            );
        }

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);

        const dbMachine = await machineController.create(name, {
            surname,
            host: host ? host : "Azure",
            plan: { expirationDate, name: plan },
            connect: { user: "Dark Cloud", password: "darkPCL" },
            openedInvoice: false,
            ownerId: userId
        });
        return NextResponse.json(dbMachine, { status: 200 });
    } catch (err) {
        console.error("Erro ao criar máquina no banco de dados:", err);
        return NextResponse.json(
            {
                message: "Erro ao criar máquina",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};