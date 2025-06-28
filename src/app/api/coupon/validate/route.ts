import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// controllers
import couponController from '@/functions/database/controllers/CouponController';

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
        };

        const { code } = await req.json();
        if (!code) {
            return NextResponse.json(
                {
                    message: 'Código do cupom não fornecido',
                    support: '@dump.ts'
                },
                { status: 400 }
            );
        };

        // Buscar o cupom no banco de dados
        const coupon = await couponController.find({ code: code.toUpperCase() });
        
        // Verificar se o cupom existe
        if (!coupon) {
            return NextResponse.json(
                {
                    valid: false,
                    message: 'Cupom inválido ou inexistente',
                    support: '@dump.ts'
                },
                { status: 404 }
            );
        }

        // Verificar se o cupom está ativo
        if (!coupon.active) {
            return NextResponse.json(
                {
                    valid: false,
                    message: 'Este cupom não está mais ativo',
                    support: '@dump.ts'
                },
                { status: 400 }
            );
        }

        // Verificar se o cupom expirou
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json(
                {
                    valid: false,
                    message: 'Este cupom expirou',
                    support: '@dump.ts'
                },
                { status: 400 }
            );
        }

        // Verificar se o cupom atingiu o limite de uso
        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return NextResponse.json(
                {
                    valid: false,
                    message: 'Este cupom atingiu o limite de uso',
                    support: '@dump.ts'
                },
                { status: 400 }
            );
        }

        // Cupom válido, retornar informações
        return NextResponse.json({
            valid: true,
            discount: coupon.discount,
            message: 'Cupom aplicado com sucesso!'
        }, { status: 200 });

    } catch (err) {
        return NextResponse.json(
            {
                message: "Erro ao validar cupom",
                error: err,
                support: '@dump.ts'
            },
            { status: 500 }
        );
    };
};