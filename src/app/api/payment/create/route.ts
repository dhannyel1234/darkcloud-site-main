import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import paymentController from '@/functions/database/controllers/PaymentController';
import { criarCobrancaPix } from '@/services/EfiPaymentService';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { planType, value, name, customId, email, couponApplied, discountPercent } = body;

        if (!planType || !value) {
            return NextResponse.json({ error: 'Plano ou valor não especificado' }, { status: 400 });
        }

        // Verificar se é um plano premium
        const isPremiumPlan = ['elite', 'plus', 'omega'].includes(planType.toLowerCase());
        
        // Gerar ID único para o pagamento incluindo o tipo do plano
        const finalCustomId = customId || `${planType.toLowerCase()}_${randomUUID()}`;

        // Cria cobrança Pix via EFI
        const descricao = `Assinatura DarkCloud - Plano ${planType}`;
        const cobranca = await criarCobrancaPix({
            valor: value,
            descricao,
            cpf: session.user?.cpf || undefined,
            nome: session.user?.name || undefined,
        });

        // Calcular data de expiração (1 hora)
        const expires_at = new Date();
        expires_at.setHours(expires_at.getHours() + 1);

        // URL de redirecionamento para planos premium
        const redirectUrl = isPremiumPlan ? 'https://app.darkcloud.store' : null;

        // Salvar pagamento no banco de dados
        const payment = await paymentController.create({
            custom_id: finalCustomId,
            payment_id: cobranca.txid,
            email: email || session.user.email || '',
            plan: planType,
            checked_all: false,
            machine_created: false,
            timeout_id: 'efi-' + Date.now(),
            price: value,
            brCode: cobranca.brCode,
            qrCodeImage: cobranca.qrCodeImage,
            userId: session.user.id,
            userName: session.user.name,
            status: 'pending',
            expires_at,
            coupon_applied: couponApplied || null,
            discount_percent: discountPercent || 0,
            redirectUrl
        });

        console.log('✅ Pagamento criado:', {
            customId: finalCustomId,
            planType,
            isPremiumPlan,
            redirectUrl,
            value
        });

        return NextResponse.json({
            success: true,
            customId: finalCustomId,
            cobranca: {
                txid: cobranca.txid,
                brCode: cobranca.brCode,
                qrCodeImage: cobranca.qrCodeImage,
                valor: value,
                status: 'pending'
            },
            isPremiumPlan,
            redirectUrl
        });

    } catch (error) {
        console.error('❌ Erro ao criar pagamento:', error);
        return NextResponse.json({ 
            error: 'Erro interno do servidor',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
    }
}