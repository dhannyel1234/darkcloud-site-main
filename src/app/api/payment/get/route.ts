import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import paymentController from '@/functions/database/controllers/PaymentController';
import EfiPay from 'sdk-node-apis-efi';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';
import path from 'path';

// Configuração do EfiPay
const certPath = path.join(process.cwd(), process.env.EFI_CERT_PATH!);
console.log('🔧 Configuração EFI:', {
  certPath,
  hasClientId: !!process.env.EFI_CLIENT_ID,
  hasClientSecret: !!process.env.EFI_CLIENT_SECRET,
  sandbox: false
});

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

    // Verifica se o payment_id (txid) é válido
    const txid = dbPayment.payment_id;
    console.log("🔑 Verificando TXID:", {
      txid,
      length: txid?.length,
      isValid: !!(txid && typeof txid === "string" && txid.length >= 26 && txid.length <= 35)
    });

    if (!txid || typeof txid !== "string" || txid.length < 26 || txid.length > 35) {
      console.error("❌ TXID inválido:", {
        txid,
        tipo: typeof txid,
        tamanho: txid?.length
      });
      return NextResponse.json(
        {
          message: "TXID inválido. Ele deve ter entre 26 e 35 caracteres alfanuméricos.",
          txid,
          support: "@known.js",
        },
        { status: 400 }
      );
    }

    // Consulta o status da cobrança Pix
    console.log("💳 Consultando status EFI para TXID:", txid);
    const pixStatus = await efipay.pixDetailCharge({ txid });
    console.log('💳 Resposta EFI:', {
      status: pixStatus.status,
      txid: pixStatus.txid,
      valor: pixStatus.valor,
      horario: pixStatus.horario,
      pixStatus: JSON.stringify(pixStatus, null, 2)
    });

    // Ativação automática do plano se o pagamento foi concluído
    const successStatus = ['CONCLUIDA', 'REALIZADA', 'CONFIRMADA', 'COMPLETED', 'CONFIRMED'];
    const isPaid = successStatus.includes(pixStatus.status?.toUpperCase());
    console.log('💰 Verificação de pagamento:', {
      status: pixStatus.status,
      isPaid,
      hasUserId: !!dbPayment.userId,
      hasPlan: !!dbPayment.plan,
      hasPrice: !!dbPayment.price
    });

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

        const planData = {
          userId: dbPayment.userId,
          userName: dbPayment.userName || session.user?.name || 'Usuário',
          planType: dbPayment.plan.toLowerCase(), // Garantir lowercase
          expiresAt,
          chargeId: dbPayment.payment_id,
          paymentValue: dbPayment.price
        };
        console.log('📝 Tentando criar plano com dados:', {
          ...planData,
          expiresAtFormatted: expiresAt ? expiresAt.toISOString() : null
        });

        const result = await userPlanController.create(planData);
        console.log('✅ Plano criado com sucesso:', {
          id: result._id,
          userId: result.userId,
          planType: result.planType,
          expiresAt: result.expiresAt
        });
        
        // Atualizar status do pagamento
        console.log('📝 Atualizando status do pagamento para completed');
        await paymentController.update(customId, { 
          status: 'completed',
          userName: session.user?.name || dbPayment.userName || 'Usuário'
        });

        const response = {
          ...dbPayment,
          pix: pixStatus,
          plan: result,
          message: 'Pagamento confirmado e plano ativado com sucesso'
        };
        console.log('✅ Resposta final sucesso:', response);
        return NextResponse.json(response);
      } catch (err) {
        console.error('❌ Erro ao ativar plano:', {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
        return NextResponse.json({
          ...dbPayment,
          pix: pixStatus,
          error: 'Erro ao ativar plano',
          details: err instanceof Error ? err.message : String(err)
        }, { status: 500 });
      }
    }

    // Retorna dados combinados
    const response = {
      ...dbPayment,
      pix: pixStatus,
    };
    console.log('✅ Resposta final (sem criação de plano):', response);
    return NextResponse.json(response, { status: 200 });

  } catch (err: any) {
    console.error("💥 Erro ao consultar pagamento Pix:", {
      error: err instanceof Error ? err.message : String(err),
      response: err?.response?.data,
      stack: err instanceof Error ? err.stack : undefined
    });

    return NextResponse.json(
      {
        message: "Erro ao consultar pagamento Pix",
        error: err?.response?.data || String(err),
        support: '@known.js',
      },
      { status: 500 }
    );
  }
}