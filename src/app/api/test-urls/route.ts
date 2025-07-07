import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    const urls = [
      'https://api.openpix.com.br/api/v1/charge',
      'https://openpix.com.br/api/v1/charge',
      'https://api.openpix.com.br/v1/charge',
      'https://openpix.com.br/v1/charge'
    ];

    const results = [];

    for (const url of urls) {
      console.log(`🧪 Testando URL: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `App ${appId}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: 1000,
            correlationID: `test-url-${Date.now()}`,
            comment: 'Teste diferentes URLs',
            customer: {
              name: 'Teste URLs',
              email: 'teste@urls.com'
            }
          })
        });

        const data = await response.json();
        
        results.push({
          url: url,
          status: response.status,
          success: response.ok,
          response: data
        });

        console.log(`📡 ${url}: ${response.status} - ${response.ok ? 'SUCESSO' : 'FALHA'}`);

      } catch (error) {
        results.push({
          url: url,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        
        console.log(`❌ ${url}: ERRO - ${error}`);
      }
    }

    // Encontrar a URL que funcionou
    const workingUrl = results.find(r => r.success);
    
    return NextResponse.json({
      success: !!workingUrl,
      message: workingUrl 
        ? `SUCESSO! URL que funcionou: ${workingUrl.url}`
        : 'Nenhuma URL funcionou - verifique a documentação da OpenPix',
      workingUrl: workingUrl || null,
      allResults: results,
      appIdUsed: appId,
      headerUsed: `App ${appId}`
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