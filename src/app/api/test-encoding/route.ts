import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    // Decodificar o AppID atual
    const decoded = atob(appId);
    const parts = decoded.split(':');
    const clientId = parts[0];
    const clientSecret = parts[1];

    console.log('🔍 Análise da codificação:');
    console.log('- AppID original:', appId);
    console.log('- Decodificado:', decoded);
    console.log('- Client ID:', clientId);
    console.log('- Client Secret:', clientSecret);

    // Verificar se há caracteres especiais
    const hasSpecialChars = /[+/=]/.test(clientSecret);
    console.log('- Tem caracteres especiais:', hasSpecialChars);

    // Recriar o AppID manualmente para testar
    const manualAppId = btoa(`${clientId}:${clientSecret}`);
    console.log('- AppID recriado:', manualAppId);
    console.log('- AppIDs são iguais:', appId === manualAppId);

    // Testar com o AppID recriado
    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': `App ${manualAppId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 1000,
        correlationID: `test-encoding-${Date.now()}`,
        comment: 'Teste codificação',
        customer: {
          name: 'Teste Codificação',
          email: 'teste@encoding.com'
        }
      })
    });

    console.log('📡 Status:', response.status);
    const data = await response.json();
    console.log('📡 Response:', data);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      error: data,
      encodingAnalysis: {
        originalAppId: appId,
        decodedContent: decoded,
        clientId: clientId,
        clientSecret: clientSecret,
        hasSpecialChars: hasSpecialChars,
        manualAppId: manualAppId,
        appIdsEqual: appId === manualAppId,
        specialCharsInSecret: clientSecret.match(/[+/=]/g) || []
      },
      testResult: {
        usedAppId: manualAppId,
        header: `App ${manualAppId}`,
        success: response.ok
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