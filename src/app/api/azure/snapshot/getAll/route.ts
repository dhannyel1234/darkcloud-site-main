import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { ClientSecretCredential } from '@azure/identity';
import { ComputeManagementClient, Snapshot } from '@azure/arm-compute';

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json(
                {
                    error: "Unauthenticated account.",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        const azureTenantId = process.env.AZURE_TENANT_ID as string;
        const azureClientId = process.env.AZURE_CLIENT_ID as string;
        const azureClientSecret = process.env.AZURE_CLIENT_SECRET as string;

        const credential = new ClientSecretCredential(azureTenantId, azureClientId, azureClientSecret);
        const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID as string;
        const resourceGroupName = process.env.AZURE_RESOURCE_GROUP_NAME as string;

        const computeClient = new ComputeManagementClient(credential, subscriptionId);

        const snapshotList: Snapshot[] = [];
        for await (const snapshot of computeClient.snapshots.listByResourceGroup(resourceGroupName)) {
            snapshotList.push(snapshot);
        };

        const snapshotPaths = snapshotList.map((snapshot) => ({
            id: snapshot.id,
            name: snapshot.name
        }));

        return NextResponse.json(snapshotPaths, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when fetching snapshots",
                support: '@known.js'
            },
            { status: 500 }
        );
    };
};