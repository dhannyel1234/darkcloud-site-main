import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { ClientSecretCredential } from '@azure/identity';
import { ComputeManagementClient, VirtualMachine, VirtualMachineInstanceView } from '@azure/arm-compute';
import { NetworkManagementClient, NetworkInterface } from '@azure/arm-network';

import adminController from '@/functions/database/controllers/AdminController';

interface VMDetail {
    vmInfo: VirtualMachine;
    powerState: VirtualMachineInstanceView['statuses'];
    publicIp: string | null;
    network: NetworkInterface;
};

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
            description: "Tentativa de acesso não autorizado à lista de máquinas Azure",
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

export async function GET(req: NextRequest): Promise<NextResponse> {
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
        };

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

        const azureTenantId = process.env.AZURE_TENANT_ID as string;
        const azureClientId = process.env.AZURE_CLIENT_ID as string;
        const azureClientSecret = process.env.AZURE_CLIENT_SECRET as string;

        const credential = new ClientSecretCredential(azureTenantId, azureClientId, azureClientSecret);
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID as string;
        const resourceGroupName = process.env.AZURE_RESOURCE_GROUP_NAME as string;

        const computeClient = new ComputeManagementClient(credential, subscriptionId);
        const networkClient = new NetworkManagementClient(credential, subscriptionId);

        // Coletar todas as máquinas virtuais em um array
        const vmList: VirtualMachine[] = [];
        for await (const vm of computeClient.virtualMachines.list(resourceGroupName)) {
            vmList.push(vm);
        };

        const vmDetailsPromises = vmList.map(async (vm): Promise<VMDetail | null> => {
            const [vmInstanceView, networkInterface] = await Promise.all([
                computeClient.virtualMachines.instanceView(resourceGroupName, vm.name as string),
                getNetworkInterface(vm, networkClient, resourceGroupName)
            ]);

            if (!networkInterface) return null;
            const publicIpAddress = await getPublicIpAddress(networkInterface, networkClient, resourceGroupName);

            return {
                vmInfo: vm,
                powerState: vmInstanceView.statuses,
                publicIp: publicIpAddress,
                network: networkInterface
            };
        });

        const vmDetails = (await Promise.all(vmDetailsPromises)).filter((detail): detail is VMDetail => detail !== null);

        return NextResponse.json(vmDetails, { status: 200 });
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

// Functions [Network]
async function getNetworkInterface(vm: VirtualMachine, networkClient: NetworkManagementClient, resourceGroupName: string): Promise<NetworkInterface | null> {
    const networkId = vm.networkProfile?.networkInterfaces?.[0]?.id;
    if (!networkId) return null;

    const networkName = networkId.split('/').pop();
    if (!networkName) return null;

    return await networkClient.networkInterfaces.get(resourceGroupName, networkName);
};
async function getPublicIpAddress(networkInterface: NetworkInterface, networkClient: NetworkManagementClient, resourceGroupName: string): Promise<string | null> {
    const publicIpId = networkInterface.ipConfigurations?.[0]?.publicIPAddress?.id;
    if (!publicIpId) return null;

    const publicIpName = publicIpId.split('/').pop();
    if (!publicIpName) return null;

    const publicIpAddress = await networkClient.publicIPAddresses.get(resourceGroupName, publicIpName);
    return publicIpAddress.ipAddress || null;
};