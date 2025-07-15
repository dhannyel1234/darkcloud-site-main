import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';
import Database from '@/functions/database/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-openpix-signature');

    // Validar assinatura do webhook
    const webhookSecret = process.env.OPENPIX_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook secret não configurado');
      return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 });
    }

    // Verificar assinatura
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Assinatura do webhook inválida');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    // Parse do payload
    const payload = JSON.parse(body);
    console.log('Webhook recebido:', payload);

    // Verificar se é uma notificação de pagamento
    if (payload.event !== 'PAYMENT_RECEIVED') {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    const { charge, customer } = payload;

    // Extrair informações da cobrança
    const correlationID = charge.correlationID;
    const value = charge.value;
    const status = charge.status;

    // Verificar se o pagamento foi confirmado
    if (status !== 'COMPLETED') {
      console.log('Pagamento não confirmado:', status);
      return NextResponse.json({ message: 'Pagamento não confirmado' }, { status: 200 });
    }

    // Extrair informações do plano e usuário do correlationID
    // Formato: planType_userId_timestamp
    const [planType, userId] = correlationID.split('_');

    if (!planType || !userId) {
      console.error('CorrelationID inválido:', correlationID);
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Buscar informações do usuário
    await Database.connect();
    const db = await Database.getDatabase();
    const user = await db.collection('users').findOne({ _id: userId });
    
    // Garantir que temos o ID do Discord e o nome do usuário
    if (!userId) {
      console.error('ID do usuário não encontrado');
      return NextResponse.json({ error: 'Dados do usuário inválidos' }, { status: 400 });
    }

    // Para plano Alfa, definir tempo fixo de 1h20m
    if (planType.toLowerCase() === 'alfa') {
      console.log('Criando plano Alfa com duração de 1h20m');
      
      const activatedPlan = await UserPlanController.create({
        userId: userId,
        userName: user?.name || 'Usuário Discord',
        planType,
        expiresAt: new Date(), // Será ignorado pelo controller
        chargeId: charge.id,
        paymentValue: value / 100
      });

      console.log('Plano Alfa ativado com sucesso:', activatedPlan);

      return NextResponse.json({ 
        message: 'Webhook processado com sucesso',
        planType,
        userId,
        userName: user?.name || 'Usuário Discord',
        value: value / 100,
        duration: '1h20m'
      });
    }

    // Para outros planos, calcular data de expiração normal
    const expiresAt = calculatePlanExpiration(planType);

    // Ativar o plano no banco de dados
    try {
      const activatedPlan = await UserPlanController.create({
        userId: userId,
        userName: user?.name || 'Usuário Discord',
        planType,
        expiresAt,
        chargeId: charge.id,
        paymentValue: value / 100
      });

      console.log(`Plano ${planType} ativado para usuário ${userId}`, activatedPlan);

      return NextResponse.json({ 
        message: 'Webhook processado com sucesso',
        planType,
        userId,
        userName: user?.name || 'Usuário Discord',
        value: value / 100,
        expiresAt
      });

    } catch (dbError) {
      console.error('Erro ao ativar plano no banco:', dbError);
      return NextResponse.json({ error: 'Erro ao ativar plano' }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Função auxiliar para calcular expiração do plano
function calculatePlanExpiration(planType: string): Date {
  const now = new Date();
  
  switch (planType.toLowerCase()) {
    case 'beta':
      // Plano Beta: 7 dias
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'omega':
      // Plano Omega: 30 dias (final do dia)
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return new Date(expiresAt.getFullYear(), expiresAt.getMonth(), expiresAt.getDate(), 23, 59, 59);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 dia padrão
  }
} 