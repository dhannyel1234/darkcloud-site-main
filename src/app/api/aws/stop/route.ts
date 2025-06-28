import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { EC2Client, StopInstancesCommand } from "@aws-sdk/client-ec2";

export async function POST(req: NextRequest) {
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
        
        const { name } = await req.json();
        if (!name) {
            return NextResponse.json(
                {
                    error: 'Some parameter was not defined',
                    support: '@dump.ts'
                },
                { status: 500 }
            );
        };

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

        const command = new StopInstancesCommand({
            InstanceIds: [name],
        });

        await ec2Client.send(command);

        return NextResponse.json(
            {
                message: "Machine successfully stopped",
                support: '@dump.ts'
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                error: "Error when stopping machine",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};