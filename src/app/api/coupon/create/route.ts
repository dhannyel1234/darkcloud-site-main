import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// controllers
import couponController from '@/functions/database/controllers/CouponController';
import adminController from '@/functions/database/controllers/AdminController';

export async function POST(req: NextRequest) {
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
        }

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

        const { code, discount, active, expiresAt, usageLimit } = await req.json();
        
        if (!code || !discount) {
            return NextResponse.json(
                {
                    message: 'Código e desconto são obrigatórios',
                    support: '@dump.ts'
                },
                { status: 400 }
            );
        }

        // Verificar se o cupom já existe
        const existingCoupon = await couponController.find({ code: code.toUpperCase() });
        if (existingCoupon) {
            return NextResponse.json(
                {
                    message: 'Este código de cupom já existe',
                    support: '@dump.ts'
                },
                { status: 400 }
            );
        }

        // Criar o cupom
        const couponData = {
            code: code.toUpperCase(),
            discount: typeof discount === 'string' ? Number(discount) : discount,
            active: active !== undefined ? active : true,
            expiresAt: expiresAt || null,
            usageLimit: usageLimit || null,
            usageCount: 0
        }

        const newCoupon = await couponController.create(couponData);

        return NextResponse.json({
            message: 'Cupom criado com sucesso',
            coupon: newCoupon
        }, { status: 201 });

    } catch (err) {
        return NextResponse.json(
            {
                message: "Erro ao criar cupom",
                error: err,
                support: '@dump.ts'
            },
            { status: 500 }
        );
    }
};