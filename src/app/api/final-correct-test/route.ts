import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    console.log('🔍 Teste final com AppID correto:');
    console.log('- AppID (Base64):', appId);
    console.log('- Header Authorization:', `App ${appId}`);

    // Decodificar apenas para mostrar o conteúdo
    const decoded = atob(appId);
    console.log('- Conteúdo decodificado:', decoded);

    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': `App ${appId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 1000,
        correlationID: `final-test-${Date.now()}`,
        comment: 'Teste final com AppID correto',
        customer: {
          name: 'Teste Final',
          email: 'teste@final.com'
        }
      })
    });

    console.log('📡 Status:', response.status);
    const data = await response.json();
    console.log('📡 Response:', data);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'SUCESSO! AppID funcionando corretamente!',
        charge: {
          id: data.charge?.identifier,
          status: data.charge?.status,
          value: data.charge?.value,
          brCode: data.brCode ? 'Presente' : 'Ausente',
          qrCodeImage: data.charge?.qrCodeImage ? 'Presente' : 'Ausente'
        },
        appIdUsed: appId,
        headerUsed: `App ${appId}`
      });
    } else {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
        message: 'AppID ainda não funcionou',
        appIdUsed: appId,
        headerUsed: `App ${appId}`,
        decodedContent: decoded,
        possibleIssues: [
          'AppID inativo ou expirado',
          'Conta sem permissões para Pix',
          'Pix não habilitado na conta',
          'Conta em análise ou suspensa',
          'Limites excedidos',
          'Ambiente incorreto (teste/produção)'
        ]
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