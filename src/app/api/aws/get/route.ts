import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { EC2Client, DescribeInstancesCommand, DescribeInstanceStatusCommand } from "@aws-sdk/client-ec2";

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
        
        const url = new URL(req.url);
        const instanceId: string | null = url.searchParams.get("name");
        if (!instanceId) {
            return NextResponse.json(
                {
                    message: "Instance ID not found in parameters",
                    support: "@dump.ts"
                },
                { status: 400 }
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

        const [instanceInfo, instanceStatus] = await Promise.all([
            ec2Client.send(new DescribeInstancesCommand({
                InstanceIds: [instanceId]
            })),
            ec2Client.send(new DescribeInstanceStatusCommand({
                InstanceIds: [instanceId]
            }))
        ]);

        const instance = instanceInfo.Reservations?.[0]?.Instances?.[0];
        if (!instance) {
            return NextResponse.json(
                {
                    message: "Instance not found",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        }

        const combinedData = {
            vmInfo: {
                instanceId: instance.InstanceId,
                instanceType: instance.InstanceType,
                launchTime: instance.LaunchTime,
                state: instance.State,
                tags: instance.Tags,
            },
            powerState: instanceStatus.InstanceStatuses?.[0]?.InstanceState,
            publicIp: instance.PublicIpAddress,
            network: {
                vpcId: instance.VpcId,
                subnetId: instance.SubnetId,
                privateIpAddress: instance.PrivateIpAddress,
                securityGroups: instance.SecurityGroups,
            }
        };

        return NextResponse.json(combinedData, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when fetching instance",
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};