import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    const body = await request.json();
    
    console.log('🔍 Criando cobrança Pix com formato correto:');
    console.log('- AppID:', appId);
    console.log('- Body:', body);

    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': `App ${appId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: body.value || 1000,
        correlationID: body.correlationID || `pedido-${Date.now()}`,
        comment: body.comment || 'Assinatura DarkCloud',
        customer: body.customer || {
          name: 'Cliente DarkCloud',
          email: 'cliente@darkcloud.com'
        }
      })
    });

    console.log('📡 Status:', response.status);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📡 Response:', data);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Cobrança Pix criada com sucesso!',
        charge: data.charge,
        brCode: data.brCode,
        qrCodeImage: data.charge?.qrCodeImage
      });
    } else {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
        message: 'Erro ao criar cobrança Pix'
      }, { status: response.status });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 