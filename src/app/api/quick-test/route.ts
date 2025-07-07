import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    // Decodificar para mostrar o conteúdo
    const decoded = atob(appId);
    const parts = decoded.split(':');
    
    console.log('🔍 AppID atual:', appId);
    console.log('🔍 Decodificado:', decoded);
    console.log('🔍 Client ID:', parts[0]);
    console.log('🔍 Client Secret (primeiros 20 chars):', parts[1]?.substring(0, 20) + '...');
    console.log('🔍 Número de partes:', parts.length);

    // Verificar se o formato está correto
    if (parts.length !== 2) {
      return NextResponse.json({
        error: 'Formato do AppID inválido - deve ter exatamente 2 partes separadas por :',
        appId: {
          original: appId,
          decoded: decoded,
          parts: parts,
          length: parts.length
        }
      });
    }

    if (!parts[0].startsWith('Client_Id_')) {
      return NextResponse.json({
        error: 'Client ID deve começar com "Client_Id_"',
        appId: {
          original: appId,
          decoded: decoded,
          clientId: parts[0]
        }
      });
    }

    if (!parts[1].startsWith('Client_Secret_')) {
      return NextResponse.json({
        error: 'Client Secret deve começar com "Client_Secret_"',
        appId: {
          original: appId,
          decoded: decoded,
          clientSecret: parts[1]
        }
      });
    }

    // Teste rápido
    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': appId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 1000,
        correlationID: `quick-test-${Date.now()}`,
        comment: 'Teste rápido',
        customer: {
          name: 'Teste Rápido',
          email: 'teste@rapido.com'
        }
      })
    });

    const data = await response.json();
    console.log('📡 Status:', response.status);
    console.log('📡 Response:', data);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      appId: {
        original: appId,
        decoded: decoded,
        clientId: parts[0],
        clientSecret: parts[1]?.substring(0, 20) + '...',
        length: appId.length,
        format: 'OK'
      },
      test: {
        url: 'https://api.openpix.com.br/api/v1/charge',
        header: `App ${appId}`,
        success: response.ok,
        response: data
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro de conexão',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 