import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado'
      });
    }

    // Análise completa do AppID
    const decoded = atob(appId);
    const parts = decoded.split(':');
    
    console.log('🔍 Análise completa do AppID:');
    console.log('- Original:', appId);
    console.log('- Decodificado:', decoded);
    console.log('- Partes:', parts.length);
    console.log('- Client ID:', parts[0]);
    console.log('- Client Secret:', parts[1]?.substring(0, 20) + '...');
    
    // Verificar se o formato está correto
    const isValidFormat = parts.length === 2 && 
                         parts[0].startsWith('Client_Id_') && 
                         parts[1].startsWith('Client_Secret_');
    
    console.log('- Formato válido:', isValidFormat);

    // Teste 1: URL da API
    const apiUrl = 'https://api.openpix.com.br/api/v1/charge';
    console.log('🧪 Teste 1: URL da API');
    console.log('- URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${appId}`,
        'user-agent': 'node-fetch'
      },
      body: JSON.stringify({
        value: 100,
        correlationID: `final-test-${Date.now()}`
      })
    });

    console.log('📡 Status:', response.status);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📡 Response:', data);

    // Análise da resposta
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'SUCESSO! API funcionando corretamente',
        appIdAnalysis: {
          isValidFormat,
          clientId: parts[0],
          clientSecretLength: parts[1]?.length || 0,
          totalLength: appId.length
        },
        charge: {
          id: data.charge?.identifier,
          status: data.charge?.status,
          brCode: data.brCode ? 'Presente' : 'Ausente',
          qrCodeImage: data.charge?.qrCodeImage ? 'Presente' : 'Ausente'
        }
      });
    } else {
      // Análise detalhada do erro
      const errorMessage = data.errors?.[0]?.message || data.error || 'Erro desconhecido';
      
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
        errorMessage,
        appIdAnalysis: {
          isValidFormat,
          clientId: parts[0],
          clientSecretLength: parts[1]?.length || 0,
          totalLength: appId.length,
          decoded: decoded
        },
        possibleIssues: [
          isValidFormat ? null : 'Formato do AppID incorreto',
          'AppID inativo ou expirado',
          'Conta sem permissões para Pix',
          'Pix não habilitado na conta',
          'Conta em análise ou suspensa',
          'Limites excedidos',
          'Ambiente incorreto (teste vs produção)'
        ].filter(Boolean),
        nextSteps: [
          'Verificar se a conta tem Pix habilitado',
          'Confirmar se o AppID está ativo',
          'Verificar permissões do AppID',
          'Contatar suporte da OpenPix',
          'Gerar novo AppID se necessário'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro de conexão',
      details: error instanceof Error ? error.message : String(error),
      possibleIssues: [
        'Problema de rede',
        'URL da API incorreta',
        'AppID mal formatado',
        'Erro interno do servidor'
      ]
    });
  }
} 