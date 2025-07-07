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
    console.log('🔍 AppID de sandbox:', appId);
    console.log('🔍 Conteúdo decodificado:', decoded);

    // URLs possíveis para sandbox
    const urls = [
      'https://api.openpix.com.br/api/v1/charge',
      'https://sandbox.openpix.com.br/api/v1/charge',
      'https://api-sandbox.openpix.com.br/api/v1/charge',
      'https://test.openpix.com.br/api/v1/charge'
    ];

    // Formatos de autorização possíveis
    const authFormats = [
      `App ${appId}`,
      `Basic ${appId}`,
      `Bearer ${appId}`,
      `App ${decoded}`,
      `Basic ${decoded}`
    ];

    const results = [];

    for (const url of urls) {
      for (const authFormat of authFormats) {
        console.log(`🧪 Testando: ${url} com ${authFormat}`);
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': authFormat,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              value: 1000,
              correlationID: `sandbox-test-${Date.now()}`,
              comment: 'Teste sandbox URLs',
              customer: {
                name: 'Teste Sandbox URLs',
                email: 'teste@sandbox-urls.com'
              }
            })
          });

          const data = await response.json();
          
          results.push({
            url: url,
            authFormat: authFormat,
            status: response.status,
            success: response.ok,
            response: data
          });

          console.log(`📡 ${url} + ${authFormat}: ${response.status} - ${response.ok ? 'SUCESSO' : 'FALHA'}`);

          // Se funcionou, parar os testes
          if (response.ok) {
            break;
          }

        } catch (error) {
          results.push({
            url: url,
            authFormat: authFormat,
            status: 'ERROR',
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
          
          console.log(`❌ ${url} + ${authFormat}: ERRO - ${error}`);
        }
      }
    }

    // Encontrar o que funcionou
    const working = results.find(r => r.success);
    
    return NextResponse.json({
      success: !!working,
      message: working 
        ? `SUCESSO! Funcionou com: ${working.url} + ${working.authFormat}`
        : 'Nenhuma combinação funcionou - verifique a documentação do sandbox',
      working: working || null,
      allResults: results,
      appIdInfo: {
        original: appId,
        decoded: decoded,
        length: appId.length
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 