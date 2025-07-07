import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import adminController from "@/functions/database/controllers/AdminController";

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
        
        const { user_id, user_name } = await req.json();
        if (!user_id) {
            return NextResponse.json(
                {
                    message: "ID not found in json",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        // Verificar se já é admin
        const existingAdmin = await adminController.find({ user_id });
        if (existingAdmin) {
            return NextResponse.json({ message: "Usuário já é administrador" });
        }

        // Criar admin
        await adminController.create({
            user_id,
            user_name: user_name || 'Admin'
        });

        return NextResponse.json({
            success: true,
            message: "Permissão de admin adicionada com sucesso"
        });
    } catch (error) {
        console.error("Erro ao definir admin:", error);
        return NextResponse.json(
            { error: "Erro ao definir admin" },
            { status: 500 }
        );
    }
};