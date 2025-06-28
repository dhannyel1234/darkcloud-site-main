import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { EC2Client, TerminateInstancesCommand } from '@aws-sdk/client-ec2';

export async function POST(req: NextRequest): Promise<NextResponse> {
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

        const body = await req.json();
        const { name } = body;
        if (!name) {
            return NextResponse.json(
                {
                    error: "Required parameters are missing",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        // Get AWS credentials from environment variables
        const region = process.env.AWS_REGION as string;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID as string;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY as string;

        const ec2Client = new EC2Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        // Delete the EC2 instance
        const command = new TerminateInstancesCommand({
            InstanceIds: [name]
        });
        
        await ec2Client.send(command);

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