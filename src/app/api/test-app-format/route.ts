import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    console.log('🧪 Testando formato App:');
    console.log('- AppID:', appId);
    console.log('- Header:', `App ${appId}`);

    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': `App ${appId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 1000,
        correlationID: `test-app-${Date.now()}`,
        comment: 'Teste formato App',
        customer: {
          name: 'Teste App',
          email: 'teste@app.com'
        }
      })
    });

    console.log('📡 Status:', response.status);
    const data = await response.json();
    console.log('📡 Response:', data);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'SUCESSO! Formato App funcionando!',
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
        message: 'Formato App ainda não funcionou',
        appIdUsed: appId,
        headerUsed: `App ${appId}`
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