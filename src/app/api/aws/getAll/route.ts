import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { EC2Client, DescribeInstancesCommand, Instance } from '@aws-sdk/client-ec2';

interface EC2Detail {
    instanceInfo: Instance;
    state: string;
    publicIp: string | null;
    networkInterfaces: any[];
}

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
        }

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

        const command = new DescribeInstancesCommand({});
        const response = await ec2Client.send(command);

        const instances: EC2Detail[] = [];

        response.Reservations?.forEach((reservation) => {
            reservation.Instances?.forEach((instance) => {
                instances.push({
                    instanceInfo: instance,
                    state: instance.State?.Name || 'unknown',
                    publicIp: instance.PublicIpAddress || null,
                    networkInterfaces: instance.NetworkInterfaces || [],
                });
            });
        });

        return NextResponse.json(instances, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when fetching instances",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    }
}
