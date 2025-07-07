import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    // Teste seguindo EXATAMENTE a documentação oficial da OpenPix
    console.log('🧪 Teste seguindo documentação oficial da OpenPix...');
    console.log('📡 URL: https://api.openpix.com.br/api/v1/charge');
    console.log('🔑 AppID:', appId.substring(0, 20) + '...');
    
    // Decodificar para verificar
    const decoded = atob(appId);
    console.log('🔍 Decodificado:', decoded);
    
    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `App ${appId}`,
        'user-agent': 'node-fetch'
      },
      body: JSON.stringify({
        value: 100,
        correlationID: `official-test-${Date.now()}`
      })
    });

    console.log('📡 Status:', response.status);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📡 Response:', data);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Documentação oficial funcionou!',
        charge: {
          id: data.charge?.identifier,
          status: data.charge?.status,
          brCode: data.brCode ? 'Presente' : 'Ausente',
          qrCodeImage: data.charge?.qrCodeImage ? 'Presente' : 'Ausente'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
        message: 'Falha seguindo documentação oficial',
        appIdInfo: {
          length: appId.length,
          decoded: decoded,
          hasColon: decoded.includes(':'),
          startsWithClient: decoded.startsWith('Client_Id_')
        }
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