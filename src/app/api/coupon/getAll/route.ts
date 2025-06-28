import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// controllers
import couponController from '@/functions/database/controllers/CouponController';
import adminController from '@/functions/database/controllers/AdminController';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json(
                {
                    error: "Conta não autenticada.",
                    support: "@dump.ts"
                },
                { status: 400 }
            );
        };

        // Verificar se o usuário é um administrador
        const admin = await adminController.find({ user_id: session.user?.id });
        if (!admin) {
            return NextResponse.json(
                {
                    message: 'Acesso não autorizado',
                    support: '@dump.ts'
                },
                { status: 403 }
            );
        }

        // Buscar todos os cupons
        const coupons = await couponController.findAll();

        return NextResponse.json({
            coupons
        }, { status: 200 });

    } catch (err) {
        return NextResponse.json(
            {
                message: "Erro ao buscar cupons",
                error: err,
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};