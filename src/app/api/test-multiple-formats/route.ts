import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    // Decodificar o AppID para obter ClientID e ClientSecret
    const decoded = atob(appId);
    const parts = decoded.split(':');
    const clientId = parts[0];
    const clientSecret = parts[1];

    console.log('🔍 Testando múltiplos formatos:');
    console.log('- AppID original:', appId);
    console.log('- Decodificado:', decoded);
    console.log('- Client ID:', clientId);
    console.log('- Client Secret:', clientSecret);

    const testCases = [
      {
        name: 'Formato App (original)',
        header: `App ${appId}`
      },
      {
        name: 'Formato Basic (original)',
        header: `Basic ${appId}`
      },
      {
        name: 'Formato App (decodificado)',
        header: `App ${decoded}`
      },
      {
        name: 'Formato Basic (decodificado)',
        header: `Basic ${decoded}`
      },
      {
        name: 'Formato Bearer (original)',
        header: `Bearer ${appId}`
      },
      {
        name: 'Formato Bearer (decodificado)',
        header: `Bearer ${decoded}`
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      console.log(`🧪 Testando: ${testCase.name}`);
      console.log(`- Header: ${testCase.header}`);

      try {
        const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
          method: 'POST',
          headers: {
            'Authorization': testCase.header,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: 1000,
            correlationID: `test-${testCase.name}-${Date.now()}`,
            comment: `Teste ${testCase.name}`,
            customer: {
              name: 'Teste Múltiplos Formatos',
              email: 'teste@formatos.com'
            }
          })
        });

        const data = await response.json();
        
        results.push({
          format: testCase.name,
          header: testCase.header,
          status: response.status,
          success: response.ok,
          response: data
        });

        console.log(`📡 ${testCase.name}: ${response.status} - ${response.ok ? 'SUCESSO' : 'FALHA'}`);

      } catch (error) {
        results.push({
          format: testCase.name,
          header: testCase.header,
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        
        console.log(`❌ ${testCase.name}: ERRO - ${error}`);
      }
    }

    // Encontrar o formato que funcionou
    const workingFormat = results.find(r => r.success);
    
    return NextResponse.json({
      success: !!workingFormat,
      message: workingFormat 
        ? `SUCESSO! Formato que funcionou: ${workingFormat.format}`
        : 'Nenhum formato funcionou - verifique a documentação da OpenPix',
      workingFormat: workingFormat || null,
      allResults: results,
      appIdAnalysis: {
        original: appId,
        decoded: decoded,
        clientId: clientId,
        clientSecret: clientSecret?.substring(0, 20) + '...',
        totalLength: appId.length
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