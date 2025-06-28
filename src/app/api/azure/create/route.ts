import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { ClientSecretCredential } from '@azure/identity';
import { ComputeManagementClient, VirtualMachine } from '@azure/arm-compute';
import { NetworkManagementClient, NetworkInterface, PublicIPAddress } from '@azure/arm-network';

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
            description: "Tentativa de criar máquina Azure sem autorização",
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

export async function POST(req: NextRequest): Promise<NextResponse> {
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
                    error: "Acesso não autorizado. Apenas administradores podem criar máquinas.",
                    support: "@dump.ts"
                },
                { status: 403 }
            );
        };

        const body = await req.json();
        const { vmSize, userId, snapshotId } = body;

        const rawName: string = body.name;
        const name: string = rawName
            .replace(/\./g, '-')
            .replace(/_/g, '-')
            .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

        if (!name || !vmSize || !userId) {
            return NextResponse.json(
                {
                    error: "Required parameters are missing",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        // Get current timestamp
        const timestamp = new Date().getTime();

        // Define resource names with sanitized name
        const resourceNames = {
            nicName: `${name}-nic-${timestamp}`,
            ipName: `${name}-ip-${timestamp}`,
            diskName: `${name}-disk-${timestamp}`,
            subnetName: 'dark' // Usando subnet default da VNet existente
        };

        // IDs dos recursos existentes
        const existingVnetId = "/subscriptions/34289525-c7e4-4ff8-a7aa-8b0823540344/resourceGroups/PegasusDark/providers/Microsoft.Network/virtualNetworks/Dark";
        const existingNsgId = "/subscriptions/34289525-c7e4-4ff8-a7aa-8b0823540344/resourceGroups/PegasusDark/providers/Microsoft.Network/networkSecurityGroups/Dark";

        // Get Azure credentials from environment variables
        const azureTenantId = process.env.AZURE_TENANT_ID as string;
        const azureClientId = process.env.AZURE_CLIENT_ID as string;
        const azureClientSecret = process.env.AZURE_CLIENT_SECRET as string;

        const credential = new ClientSecretCredential(azureTenantId, azureClientId, azureClientSecret);
        const subscriptionId: string = process.env.AZURE_SUBSCRIPTION_ID as string;
        const resourceGroupName: string = process.env.AZURE_RESOURCE_GROUP_NAME as string;
        const token = await credential.getToken("https://management.azure.com/.default");

        const computeClient = new ComputeManagementClient(credential, subscriptionId);
        const networkClient = new NetworkManagementClient(credential, subscriptionId);

        // Obter informações da VNet existente
        const vnet = await networkClient.virtualNetworks.get(
            "PegasusDark", // Usando o resource group específico da VNet
            "Dark"
        );

        // Obter a subnet default da VNet
        const subnet = vnet.subnets?.find(s => s.name === 'dark');
        if (!subnet?.id) {
            return NextResponse.json(
                {
                    error: "Subnet 'default' not found in existing VNet",
                    support: '@dump.ts'
                },
                { status: 500 }
            );
        };

        // Create public IP
        const publicIPParameters: PublicIPAddress = {
            location: 'brazilsouth',
            sku: {
                name: 'Standard',
                tier: 'Regional'
            },
            publicIPAllocationMethod: 'Static',
            publicIPAddressVersion: 'IPv4',
            dnsSettings: {
                domainNameLabel: `${name.toLowerCase()}-${timestamp}`
            }
        };
        const publicIP = await networkClient.publicIPAddresses.beginCreateOrUpdateAndWait(
            resourceGroupName,
            resourceNames.ipName,
            publicIPParameters
        );

        // Create network interface
        const nicParameters: NetworkInterface = {
            location: 'brazilsouth',
            enableAcceleratedNetworking: false,
            enableIPForwarding: false,
            ipConfigurations: [{
                name: `${resourceNames.nicName}-ipconfig`,
                primary: true,
                privateIPAddressVersion: 'IPv4',
                privateIPAllocationMethod: 'Dynamic',
                publicIPAddress: publicIP,
                subnet: { id: subnet.id }
            }],
            networkSecurityGroup: {
                id: existingNsgId
            },
            tags: {
                displayName: resourceNames.nicName
            }
        };
        const networkInterface = await networkClient.networkInterfaces.beginCreateOrUpdateAndWait(
            resourceGroupName,
            resourceNames.nicName,
            nicParameters
        );

        // Create disk from snapshot
        const diskParams = {
            location: 'brazilsouth',
            creationData: {
                createOption: 'Copy',
                sourceResourceId: snapshotId ? snapshotId : process.env.AZURE_MACHINE_SNAPSHOT_ID_WIN11 as string
            },
            sku: { name: 'Standard_LRS' }
        };
        const disk = await computeClient.disks.beginCreateOrUpdateAndWait(
            resourceGroupName,
            resourceNames.diskName,
            diskParams
        );

        // Get disk security type information
        const diskInfo = await computeClient.disks.get(
            resourceGroupName,
            resourceNames.diskName
        );

        // Create VM using the created disk with matching security settings
        const machineParameters: VirtualMachine = {
            location: 'brazilsouth',
            hardwareProfile: {
                vmSize: vmSize
            },
            priority: 'Spot',
            evictionPolicy: 'Deallocate',
            billingProfile: {
                maxPrice: -1
            },
            networkProfile: {
                networkInterfaces: [
                    { id: networkInterface.id }
                ]
            },
            storageProfile: {
                osDisk: {
                    osType: 'Windows',
                    createOption: 'Attach',
                    managedDisk: { id: disk.id }
                }
            },
            // Add securityProfile to match disk security type
            securityProfile: {
                securityType: diskInfo.securityProfile?.securityType || 'Standard',
                uefiSettings: diskInfo.securityProfile?.securityType === 'TrustedLaunch' ? 
                    { secureBootEnabled: true, vTpmEnabled: true } : undefined
            }
        };
        const machine = await computeClient.virtualMachines.beginCreateOrUpdateAndWait(
            resourceGroupName,
            name,
            machineParameters
        );

        // Create shutdown schedule
        // Create shutdown schedule
        const shutdownParams = {
            properties: {
                status: "Enabled",
                taskType: "ComputeVmShutdownTask",
                dailyRecurrence: {
                    time: "0500" // 05h AM
                },
                timeZoneId: "E. South America Standard Time", // Brazil Time
                notificationSettings: {
                    status: "Disabled"
                },
                targetResourceId: machine.id
            },
            location: 'brazilsouth'
        };
        await fetch(`https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/microsoft.devtestlab/schedules/shutdown-computevm-${name}?api-version=2018-09-15`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shutdownParams)
        }
        );

        return NextResponse.json(
            {
                message: "Máquina virtual criada com sucesso",
                machine: machine
            },
            { status: 200 }
        );
    } catch (err) {
        console.error('Error creating virtual machine:', err);
        return NextResponse.json(
            {
                error: "Error creating virtual machine",
                message: err instanceof Error ? err.message : 'Unknown error',
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};