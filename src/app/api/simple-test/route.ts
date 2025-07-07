import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    // Teste simples - apenas verificar se conseguimos conectar
    console.log('🧪 Teste simples de conexão com OpenPix...');
    
    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${appId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 100,
        correlationID: `simple-test-${Date.now()}`,
        comment: 'Teste simples',
        customer: {
          name: 'Teste',
          email: 'teste@teste.com'
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
        message: 'Conexão funcionando!',
        charge: {
          id: data.charge?.identifier,
          status: data.charge?.status,
          brCode: data.brCode ? 'Presente' : 'Ausente'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
        message: 'Falha na autenticação ou permissões',
        suggestions: [
          'Verifique se a conta tem Pix habilitado',
          'Confirme se o AppID tem permissões para Pix',
          'Verifique se a conta está ativa',
          'Entre em contato com o suporte da OpenPix'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro de conexão',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 