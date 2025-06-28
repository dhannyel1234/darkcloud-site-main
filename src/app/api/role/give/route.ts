import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

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
        
        const { user_id } = await req.json();
        if (!user_id) {
            return NextResponse.json(
                {
                    message: "ID not found in json",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        const guildId = process.env.DISCORD_GUILD_ID as string;
        const roleId = process.env.DISCORD_ROLE_ID as string;
        const botToken = process.env.DISCORD_BOT_TOKEN as string;

        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${user_id}/roles/${roleId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return NextResponse.json(
                { success: "Role successfully assigned to user on Discord", support: '@dump.ts' },
                { status: 200 }
            );
        } else {
            const errorData = await response.json();
            return NextResponse.json(
                { message: "Error assigning role to user on Discord", error: errorData, support: '@dump.ts' },
                { status: response.status }
            );
        }
    } catch (err) {
        return NextResponse.json(
            { message: "Error assigning role to user on Discord", error: err, support: '@dump.ts' },
            { status: 500 }
        );
    };
};