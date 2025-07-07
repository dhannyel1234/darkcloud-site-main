import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    // Decodificar o AppID
    let decodedAppId = '';
    try {
      decodedAppId = atob(appId);
    } catch (error) {
      return NextResponse.json({
        error: 'AppID não é Base64 válido',
        details: error
      });
    }

    // Testar diferentes formatos de autenticação
    const tests = [
      {
        name: 'Basic Auth (padrão)',
        headers: {
          'Authorization': `Basic ${appId}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Basic Auth com trim',
        headers: {
          'Authorization': `Basic ${appId.trim()}`,
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'Basic Auth recodificado',
        headers: {
          'Authorization': `Basic ${btoa(decodedAppId)}`,
          'Content-Type': 'application/json'
        }
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`🧪 Testando: ${test.name}`);
        
        const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
          method: 'POST',
          headers: test.headers,
          body: JSON.stringify({
            value: 100,
            correlationID: `debug-${Date.now()}-${test.name}`,
            comment: 'Debug OpenPix',
            customer: {
              name: 'Debug',
              email: 'debug@test.com'
            }
          })
        });

        const data = await response.json();
        
        results.push({
          test: test.name,
          status: response.status,
          success: response.ok,
          data: data
        });

        console.log(`📡 ${test.name} - Status: ${response.status}`);
        
        if (response.ok) {
          console.log(`✅ ${test.name} FUNCIONOU!`);
        } else {
          console.log(`❌ ${test.name} falhou:`, data);
        }

      } catch (error) {
        console.log(`❌ ${test.name} erro:`, error);
        results.push({
          test: test.name,
          status: 'ERROR',
          success: false,
          data: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }

    return NextResponse.json({
      appId: {
        original: appId,
        decoded: decodedAppId,
        length: appId.length,
        trimmed: appId.trim(),
        recoded: btoa(decodedAppId)
      },
      results: results,
      successfulTests: results.filter(r => r.success).map(r => r.test),
      failedTests: results.filter(r => !r.success).map(r => ({ test: r.test, status: r.status, error: r.data }))
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 