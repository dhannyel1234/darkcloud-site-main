import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { EC2Client, DescribeSnapshotsCommand } from '@aws-sdk/client-ec2';

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

        const awsRegion = process.env.AWS_REGION as string;
        const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID as string;
        const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY as string;

        const ec2Client = new EC2Client({
            region: awsRegion,
            credentials: {
                accessKeyId: awsAccessKeyId,
                secretAccessKey: awsSecretAccessKey,
            },
        });

        const command = new DescribeSnapshotsCommand({
            OwnerIds: ['self'], // Only get snapshots owned by the account
        });

        const response = await ec2Client.send(command);
        
        const snapshotPaths = response.Snapshots?.map((snapshot) => ({
            id: snapshot.SnapshotId,
            name: snapshot.Tags?.find(tag => tag.Key === 'Name')?.Value || snapshot.SnapshotId
        })) || [];

        return NextResponse.json(snapshotPaths, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when fetching snapshots",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};