import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import paymentController from '@/functions/database/controllers/PaymentController';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';
import { EfiPay } from 'sdk-typescript-apis-efi';
import * as fs from 'fs';
import * as path from 'path';

// Configuração do EFI
const certPath = path.join(process.cwd(), 'certs', 'homologacao-405529-darkcloud.p12');

const efipay = new EfiPay({
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  certificate: certPath,
  sandbox: false,
  validateMtls: false
});

// Instância do UserPlanController
const userPlanController = UserPlanController.getInstance();

export async function GET(req: NextRequest) {
  const startTime = new Date().toISOString();
  console.log(`\n🚀 [${startTime}] INICIANDO VERIFICAÇÃO DE PAGAMENTO`);
  
  try {
    // Verifica sessão
    const session = await getServerSession();
    console.log('👤 Dados da sessão:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userName: session?.user?.name
    });

    if (!session) {
      console.warn("🔒 Sessão inválida - usuário não autenticado");
      return NextResponse.json(
        {
          error: "Conta não autenticada.",
          support: "@known.js",
        },
        { status: 400 }
      );
    }

    // Lê parâmetros da URL
    const url = new URL(req.url);
    const customId = url.searchParams.get("id");
    console.log("🔍 Parâmetros recebidos:", {
      customId,
      fullUrl: req.url
    });

    if (!customId) {
      console.warn("❌ ID não fornecido na URL");
      return NextResponse.json(
        {
          message: "ID não fornecido nos parâmetros",
          support: "@known.js",
        },
        { status: 400 }
      );
    }

    // Busca no banco de dados
    console.log("📦 Buscando pagamento no banco:", customId);
    const dbPayment = await paymentController.find({ custom_id: customId });
    console.log("📦 Resultado do banco:", {
      encontrado: !!dbPayment,
      dados: dbPayment
    });

    if (!dbPayment) {
      console.warn("❌ Pagamento não encontrado no banco:", customId);
      return NextResponse.json(
        {
          message: "Pagamento não encontrado no banco de dados",
          support: "@known.js",
        },
        { status: 404 }
      );
    }

    // Verifica se o pagamento já foi processado
    if (dbPayment.checked_all) {
      console.log("✅ Pagamento já foi processado anteriormente");
      return NextResponse.json({
        ...dbPayment,
        pix: { status: 'CONCLUIDA' },
        message: 'Pagamento já foi processado'
      });
    }

    // Verifica status do pagamento na EFI
    console.log("🔍 Verificando status na EFI:", dbPayment.payment_id);
    const pixStatus = await efipay.pixDetailCharge({
      txid: dbPayment.payment_id
    });

    console.log("📡 Status da EFI:", {
      status: pixStatus.status,
      pago: pixStatus.pix?.some((p: any) => p.valor > 0)
    });

    // Verifica se foi pago
    const isPaid = pixStatus.status === 'CONCLUIDA' || 
                   (pixStatus.pix && pixStatus.pix.some((p: any) => p.valor > 0));

    if (isPaid && dbPayment.userId && dbPayment.plan && dbPayment.price) {
      try {
        console.log('✨ Pagamento confirmado, verificando plano existente...');
        
        // Verificar se já existe um plano ativo
        const existingPlan = await userPlanController.hasActivePlan(dbPayment.userId, dbPayment.plan);
        console.log('🔍 Verificação de plano existente:', {
          userId: dbPayment.userId,
          planType: dbPayment.plan,
          hasExistingPlan: !!existingPlan,
          existingPlan
        });

        if (existingPlan) {
          console.log('⚠️ Usuário já possui plano ativo:', existingPlan);
          return NextResponse.json({
            ...dbPayment,
            pix: pixStatus,
            message: 'Pagamento confirmado, mas usuário já possui plano ativo'
          });
        }

        // Verificar se é um plano premium
        const isPremiumPlan = ['elite', 'plus', 'omega'].includes(dbPayment.plan.toLowerCase());
        
        // Calcular data de expiração baseado no tipo do plano
        let expiresAt = null;
        const now = new Date();
        
        if (dbPayment.plan.toLowerCase() === 'alfa') {
          expiresAt = null; // Plano Alfa não usa expiresAt
        } else if (dbPayment.plan.toLowerCase() === 'beta') {
          // Beta: 7 dias a partir de agora
          expiresAt = new Date(now.getTime());
          expiresAt.setDate(expiresAt.getDate() + 7);
          // Definir para 23:59:59 do último dia
          expiresAt.setHours(23, 59, 59, 999);
        } else if (dbPayment.plan.toLowerCase() === 'omega') {
          // Omega: 30 dias a partir de agora
          expiresAt = new Date(now.getTime());
          expiresAt.setDate(expiresAt.getDate() + 30);
          // Definir para 23:59:59 do último dia
          expiresAt.setHours(23, 59, 59, 999);
        }
        // Para planos premium (ELITE, PLUS, OMEGA), não definir data de expiração

        // URL de redirecionamento para planos premium
        const redirectUrl = isPremiumPlan ? 'https://app.darkcloud.store' : null;

        console.log('🎯 Criando plano:', {
          userId: dbPayment.userId,
          userName: dbPayment.userName,
          planType: dbPayment.plan,
          expiresAt,
          isPremiumPlan,
          redirectUrl
        });

        // Criar plano do usuário
        await userPlanController.create({
          userId: dbPayment.userId,
          userName: dbPayment.userName,
          planType: dbPayment.plan,
          expiresAt,
          chargeId: dbPayment.payment_id,
          paymentValue: dbPayment.price,
          redirectUrl
        });

        // Marcar pagamento como processado
        await paymentController.update(customId, { checked_all: true });

        console.log('✅ Plano criado com sucesso!');

        return NextResponse.json({
          ...dbPayment,
          pix: pixStatus,
          isPremiumPlan,
          redirectUrl,
          message: 'Pagamento confirmado e plano ativado'
        });

      } catch (error) {
        console.error('❌ Erro ao criar plano:', error);
        return NextResponse.json({
          ...dbPayment,
          pix: pixStatus,
          error: 'Erro ao criar plano',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    // Retorna status atual do pagamento
    return NextResponse.json({
      ...dbPayment,
      pix: pixStatus,
      message: isPaid ? 'Pagamento confirmado' : 'Aguardando pagamento'
    });

  } catch (error) {
    console.error('❌ Erro na verificação de pagamento:', error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        support: "@known.js",
      },
      { status: 500 }
    );
  }
}