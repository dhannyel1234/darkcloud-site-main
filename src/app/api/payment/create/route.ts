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
        const { planType, value } = body;

        if (!planType || !value) {
            return NextResponse.json({ error: 'Plano ou valor não especificado' }, { status: 400 });
        }

        // Gerar ID único para o pagamento incluindo o tipo do plano
        const custom_id = `${planType.toLowerCase()}_${randomUUID()}`;

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

        // Salvar pagamento no banco de dados
        const payment = await paymentController.create({
            custom_id,
            payment_id: cobranca.txid,
            email: session.user.email || '',
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
            expires_at
        });

        if (payment) {
            return NextResponse.json({
                success: true,
                cobranca: {
                    ...cobranca,
                    status: 'Aguardando pagamento',
                    custom_id,
                    userId: session.user.id,
                    userName: session.user.name
                }
            });
        } else {
            return NextResponse.json({ error: 'Erro ao salvar pagamento' }, { status: 400 });
        }
    } catch (error) {
        console.error('❌ Erro ao criar cobrança:', error);
        return NextResponse.json(
            { 
                error: 'Erro ao criar cobrança', 
                details: error instanceof Error ? error.message : String(error)
            }, 
            { status: 500 }
        );
    }
}