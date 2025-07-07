import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { plan } = await request.json();
    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não especificado' },
        { status: 400 }
      );
    }

    // Definir valores dos planos básicos em centavos
    const planValues: Record<string, number> = {
      alfa: 1,      // R$ 0,01
      omega: 1,     // R$ 0,01
      beta: 3990    // R$ 39,90
    };
    
    const value = planValues[plan as keyof typeof planValues];
    if (!value) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      );
    }

    // Gerar um correlationID único
    const correlationID = crypto.randomUUID();
    
    // Obter o AppID da OpenPix
    const appId = process.env.OPENPIX_APP_ID;
    if (!appId) {
      console.error('❌ OPENPIX_APP_ID não configurado no .env.local');
      return NextResponse.json(
        { error: 'Configuração da OpenPix não encontrada' }, 
        { status: 500 }
      );
    }

    console.log('🔑 AppID configurado:', appId ? 'Sim' : 'Não');
    console.log('💰 Valor em centavos:', value);
    console.log('🆔 CorrelationID:', correlationID);

    // Chamar a API da OpenPix exatamente como esperado
    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': `App ${appId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: value, // em centavos
        correlationID: correlationID,
        comment: `Assinatura DarkCloud - Plano ${plan}`,
        customer: {
          name: session.user?.name || 'Usuário',
          email: session.user?.email || 'usuario@darkcloud.com'
        }
      })
    });

    console.log('📡 Status da resposta OpenPix:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error('❌ Erro da OpenPix:', errorData);
      
      return NextResponse.json(
        { 
          error: 'Erro ao criar cobrança Pix', 
          details: errorData,
          status: response.status
        }, 
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('✅ Cobrança criada com sucesso:', {
      chargeId: data.charge?.identifier,
      status: data.charge?.status,
      brCode: data.brCode ? 'Presente' : 'Ausente',
      qrCodeImage: data.charge?.qrCodeImage ? 'Presente' : 'Ausente'
    });

    // Retornar dados relevantes para o frontend
    return NextResponse.json({
      success: true,
      charge: {
        id: data.charge?.identifier,
        status: data.charge?.status,
        value: data.charge?.value,
        correlationID: data.charge?.correlationID,
        expiresDate: data.charge?.expiresDate,
        expiresIn: data.charge?.expiresIn
      },
      pix: {
        brCode: data.brCode,
        qrCodeImage: data.charge?.qrCodeImage,
        paymentUrl: data.charge?.paymentLinkUrl,
        pixKey: data.charge?.pixKey
      }
    });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 