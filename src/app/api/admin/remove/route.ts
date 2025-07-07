import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';

// controllers
import adminController from '@/functions/database/controllers/AdminController';
import UserPlan from '@/functions/database/schemas/UserPlanSchema';
import Database from '@/functions/database/database';

export async function POST(req: NextRequest) {
    try {
        const { user_id } = await req.json();
        if (!user_id) {
            return NextResponse.json(
                {
                    message: "ID not found in json",
                    support: "@rw.ts"
                },
                { status: 400 }
            );
        };

        const dbAdmin = await adminController.remove({ user_id });
        return NextResponse.json(dbAdmin, { status: 200 });
    } catch (err) {
        return NextResponse.json(
            {
                message: "Error when removing administrator",
                error: err,
                support: '@rw.ts'
            },
            { status: 500 }
        );
    };
};

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, planType } = body;

        if (!userId || !planType) {
            return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 });
        }

        await Database.connect();

        // Primeiro verificar se o plano existe e está cancelado
        const plan = await UserPlan.findOne({ userId, planType });
        
        if (!plan) {
            return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
        }

        if (plan.status !== 'cancelled') {
            return NextResponse.json({ 
                error: 'Apenas planos cancelados podem ser deletados.',
                currentStatus: plan.status
            }, { status: 400 });
        }

        const deleted = await userPlanController.deletePlan(userId, planType);

        if (deleted) {
            return NextResponse.json({ success: true, message: 'Plano deletado com sucesso.' });
        } else {
            return NextResponse.json({ error: 'Falha ao deletar o plano.' }, { status: 500 });
        }
    } catch (error) {
        console.error('Erro ao deletar plano:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}