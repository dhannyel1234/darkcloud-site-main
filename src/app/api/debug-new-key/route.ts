import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    // Decodificar e analisar a nova chave
    const decoded = atob(appId);
    const parts = decoded.split(':');
    
    console.log('🔍 Nova chave analisada:');
    console.log('- AppID:', appId);
    console.log('- Decodificado:', decoded);
    console.log('- Client ID:', parts[0]);
    console.log('- Client Secret:', parts[1]);

    // Teste 1: URL de teste da OpenPix
    const testUrl = 'https://api.openpix.com.br/api/v1/charge';
    
    console.log('🧪 Teste 1: URL de produção');
    console.log('- URL:', testUrl);
    
    const response1 = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${appId}`,
        'User-Agent': 'darkcloud-site/1.0'
      },
      body: JSON.stringify({
        value: 100,
        correlationID: `test-${Date.now()}`,
        expiresIn: 3600
      })
    });

    console.log('📡 Status 1:', response1.status);
    const data1 = await response1.json();
    console.log('📡 Response 1:', data1);

    // Teste 2: URL alternativa (sem /api)
    const testUrl2 = 'https://openpix.com.br/api/v1/charge';
    
    console.log('🧪 Teste 2: URL alternativa');
    console.log('- URL:', testUrl2);
    
    const response2 = await fetch(testUrl2, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${appId}`,
        'User-Agent': 'darkcloud-site/1.0'
      },
      body: JSON.stringify({
        value: 100,
        correlationID: `test2-${Date.now()}`,
        expiresIn: 3600
      })
    });

    console.log('📡 Status 2:', response2.status);
    const data2 = await response2.json();
    console.log('📡 Response 2:', data2);

    // Teste 3: Endpoint de status da conta
    const statusUrl = 'https://api.openpix.com.br/api/v1/account';
    
    console.log('🧪 Teste 3: Status da conta');
    console.log('- URL:', statusUrl);
    
    const response3 = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${appId}`,
        'User-Agent': 'darkcloud-site/1.0'
      }
    });

    console.log('📡 Status 3:', response3.status);
    const data3 = await response3.json();
    console.log('📡 Response 3:', data3);

    return NextResponse.json({
      success: false,
      appIdAnalysis: {
        original: appId,
        decoded: decoded,
        clientId: parts[0],
        clientSecret: parts[1],
        totalLength: appId.length
      },
      tests: {
        test1: {
          url: testUrl,
          status: response1.status,
          response: data1
        },
        test2: {
          url: testUrl2,
          status: response2.status,
          response: data2
        },
        test3: {
          url: statusUrl,
          status: response3.status,
          response: data3
        }
      },
      conclusion: response1.status === 401 && response2.status === 401 && response3.status === 401 
        ? 'Todas as URLs retornam 401 - problema definitivamente na conta/AppID'
        : 'Alguma URL funcionou - problema pode ser na URL específica'
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