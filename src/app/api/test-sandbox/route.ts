import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    console.log('🧪 Teste rápido com AppID de sandbox:');
    console.log('- AppID:', appId);

    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': `App ${appId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 1000,
        correlationID: `quick-sandbox-test-${Date.now()}`,
        comment: 'Teste rápido sandbox',
        customer: {
          name: 'Teste Rápido',
          email: 'teste@rapido.com'
        }
      })
    });

    console.log('📡 Status:', response.status);
    const data = await response.json();
    console.log('📡 Response:', data);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'SUCESSO! Sandbox funcionando!',
        environment: 'sandbox',
        charge: {
          id: data.charge?.identifier,
          status: data.charge?.status,
          value: data.charge?.value,
          brCode: data.brCode ? 'Presente' : 'Ausente',
          qrCodeImage: data.charge?.qrCodeImage ? 'Presente' : 'Ausente'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
        message: 'Erro no sandbox',
        environment: 'sandbox'
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

export async function POST(request: Request) {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    const body = await request.json();
    
    console.log('🧪 Testando com AppID de sandbox:');
    console.log('- AppID:', appId);
    console.log('- Body recebido:', body);

    // URL de sandbox da OpenPix (se existir) ou URL normal
    const apiUrl = 'https://api.openpix.com.br/api/v1/charge';
    
    console.log('- URL da API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `App ${appId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: body.value || 1000,
        correlationID: body.correlationID || `sandbox-test-${Date.now()}`,
        comment: body.comment || 'Teste ambiente sandbox',
        customer: body.customer || {
          name: 'Cliente Sandbox',
          email: 'cliente@sandbox.com'
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
        message: 'SUCESSO! AppID de sandbox funcionando!',
        environment: 'sandbox',
        charge: {
          id: data.charge?.identifier,
          status: data.charge?.status,
          value: data.charge?.value,
          brCode: data.brCode ? 'Presente' : 'Ausente',
          qrCodeImage: data.charge?.qrCodeImage ? 'Presente' : 'Ausente',
          expiresIn: data.charge?.expiresIn
        },
        appIdUsed: appId,
        headerUsed: `App ${appId}`
      });
    } else {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
        message: 'Erro no ambiente sandbox',
        environment: 'sandbox',
        appIdUsed: appId,
        headerUsed: `App ${appId}`,
        possibleIssues: [
          'AppID de sandbox inválido',
          'Sandbox não configurado corretamente',
          'URL de sandbox diferente',
          'Permissões de sandbox não habilitadas'
        ]
      }, { status: response.status });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro de conexão no sandbox',
      details: error instanceof Error ? error.message : String(error),
      environment: 'sandbox'
    }, { status: 500 });
  }
} 