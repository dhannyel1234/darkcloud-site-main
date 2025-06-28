import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { ClientSecretCredential } from '@azure/identity';
import { ComputeManagementClient } from '@azure/arm-compute';

import adminController from '@/functions/database/controllers/AdminController';
import machineController from '@/functions/database/controllers/MachineController';

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
            description: "Tentativa de excluir máquina Azure sem autorização",
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

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession();
        if (!session || !session.user?.id) {
            return NextResponse.json(
                {
                    error: "Conta não autenticada.",
                    support: "@known.js"
                },
                { status: 401 }
            );
        };

        const body = await req.json();
        const { name } = body;
        if (!name) {
            return NextResponse.json(
                {
                    error: "Nome da máquina não fornecido.",
                    support: "@known.js"
                },
                { status: 400 }
            );
        };

        // Verifica se o usuário é admin
        const isAdmin = await adminController.find({ user_id: session.user.id });
        if (!isAdmin) {
            // Registra tentativa maliciosa
            await sendMaliciousAccessWebhook(req, session, name);
            
            return NextResponse.json(
                {
                    error: "Acesso não autorizado. Apenas administradores podem excluir máquinas.",
                    support: "@known.js"
                },
                { status: 403 }
            );
        };
        if (!name) {
            return NextResponse.json(
                {
                    error: "Required parameters are missing",
                    support: "@known.js"
                },
                { status: 400 }
            );
        };

        // Get Azure credentials from environment variables
        const azureTenantId = process.env.AZURE_TENANT_ID as string;
        const azureClientId = process.env.AZURE_CLIENT_ID as string;
        const azureClientSecret = process.env.AZURE_CLIENT_SECRET as string;

        const credential = new ClientSecretCredential(azureTenantId, azureClientId, azureClientSecret);
        const subscriptionId: string = process.env.AZURE_SUBSCRIPTION_ID as string;
        const resourceGroupName: string = process.env.AZURE_RESOURCE_GROUP_NAME as string;

        const computeClient = new ComputeManagementClient(credential, subscriptionId);

        // Delete the VM
        console.log(`Deleting virtual machine ${name}...`);
        await computeClient.virtualMachines.beginDeleteAndWait(resourceGroupName, name);

        console.log(`Virtual machine ${name} deleted successfully.`);

        return NextResponse.json(
            {
                message: "Virtual machine successfully deleted",
                support: '@dump.ts'
            },
            { status: 200 }
        );
    } catch (err) {
        console.error('Error deleting virtual machine:', err);
        return NextResponse.json(
            {
                error: "Error deleting virtual machine",
                message: err instanceof Error ? err.message : 'Unknown error',
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};