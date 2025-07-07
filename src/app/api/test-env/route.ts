import { NextResponse } from 'next/server';

// Função para formatar o token (mesma do openpix.ts)
function formatarTokenOpenPix(token: string | undefined): string | null {
  if (!token) return null;
  
  if (token.startsWith('Basic ')) {
    return token;
  }
  
  return `Basic ${token}`;
}

// Função para verificar se o token é apenas Client ID
function verificarTokenOpenPix(token: string | undefined): { tipo: string; mensagem: string } {
  if (!token) {
    return { tipo: 'vazio', mensagem: 'Token não configurado' };
  }
  
  // Se tem "Basic", verifica o conteúdo
  if (token.startsWith('Basic ')) {
    const conteudo = token.replace('Basic ', '');
    if (conteudo.startsWith('Client_Id_') && conteudo.includes(':')) {
      return { tipo: 'appid_completo', mensagem: 'AppID completo detectado' };
    } else if (conteudo.startsWith('Client_Id_') && !conteudo.includes(':')) {
      return { tipo: 'client_id_apenas', mensagem: 'Apenas Client ID detectado - precisa do AppID completo' };
    }
  } else {
    // Se não tem "Basic"
    if (token.startsWith('Client_Id_') && token.includes(':')) {
      return { tipo: 'appid_sem_basic', mensagem: 'AppID completo sem Basic - será formatado automaticamente' };
    } else if (token.startsWith('Client_Id_') && !token.includes(':')) {
      return { tipo: 'client_id_apenas', mensagem: 'Apenas Client ID detectado - precisa do AppID completo' };
    }
  }
  
  return { tipo: 'desconhecido', mensagem: 'Formato de token desconhecido' };
}

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    console.log('🔍 Testando configuração da OpenPix...');
    console.log('🔑 AppID presente:', appId ? 'Sim' : 'Não');
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado',
        message: 'Configure a variável OPENPIX_APP_ID no arquivo .env.local'
      });
    }

    // Verificar formato do AppID
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(appId);
    let decodedAppId = '';
    let hasColon = false;
    
    try {
      decodedAppId = atob(appId);
      hasColon = decodedAppId.includes(':');
    } catch (error) {
      console.log('❌ Erro ao decodificar Base64:', error);
    }
    
    // Verificar caracteres especiais
    const hasSpecialChars = /[^A-Za-z0-9+/=]/.test(appId);
    const hasSpaces = appId.includes(' ');
    const hasNewlines = appId.includes('\n') || appId.includes('\r');
    const trimmedAppId = appId.trim();
    const isTrimmed = trimmedAppId !== appId;
    
    console.log('🔍 Formato do AppID:');
    console.log('- É Base64 válido:', isBase64);
    console.log('- Contém ClientID:ClientSecret:', hasColon);
    console.log('- Decodificado:', decodedAppId);
    console.log('- Tem caracteres especiais:', hasSpecialChars);
    console.log('- Tem espaços:', hasSpaces);
    console.log('- Tem quebras de linha:', hasNewlines);
    console.log('- Precisa de trim:', isTrimmed);
    console.log('- Comprimento original:', appId.length);
    console.log('- Comprimento após trim:', trimmedAppId.length);
    
    if (!isBase64) {
      console.log('⚠️ AVISO: AppID não parece ser Base64 válido');
    }

    // Usar o AppID limpo para os testes
    const cleanAppId = trimmedAppId;

    // Testar criação de cobrança Pix
    console.log('🧪 Testando criação de cobrança Pix...');
    console.log('📡 URL: https://api.openpix.com.br/api/v1/charge');
    console.log('🔑 Authorization: Basic', cleanAppId.substring(0, 20) + '...');
    
    const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${cleanAppId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 100, // R$ 1,00 em centavos
        correlationID: `test-${Date.now()}`,
        comment: 'Teste DarkCloud',
        customer: {
          name: 'Teste',
          email: 'teste@darkcloud.com'
        }
      })
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      responseData = { error: 'Não foi possível parsear JSON' };
    }
    
    console.log('📡 Response:', responseData);
    
    if (response.ok) {
      console.log('✅ Teste bem-sucedido!');
      
      return NextResponse.json({
        success: true,
        message: 'Conexão com OpenPix funcionando corretamente!',
        appIdFormat: {
          isBase64,
          hasColon,
          length: appId.length,
          decoded: decodedAppId,
          hasSpecialChars,
          hasSpaces,
          hasNewlines,
          isTrimmed,
          cleanLength: cleanAppId.length
        },
        testCharge: {
          id: responseData.charge?.identifier,
          status: responseData.charge?.status,
          brCode: responseData.brCode ? 'Presente' : 'Ausente',
          qrCodeImage: responseData.charge?.qrCodeImage ? 'Presente' : 'Ausente',
          paymentUrl: responseData.charge?.paymentLinkUrl ? 'Presente' : 'Ausente'
        }
      });
    } else {
      console.log('❌ Erro na API:', responseData);
      
      return NextResponse.json({
        success: false,
        error: 'Erro na API da OpenPix',
        status: response.status,
        details: responseData,
        appIdFormat: {
          isBase64,
          hasColon,
          length: appId.length,
          decoded: decodedAppId,
          hasSpecialChars,
          hasSpaces,
          hasNewlines,
          isTrimmed,
          cleanLength: cleanAppId.length
        },
        message: 'O AppID parece estar inválido ou a conta não tem as permissões necessárias',
        suggestions: [
          'Verifique se o AppID está correto no painel da OpenPix',
          'Confirme se o AppID tem permissões para Pix',
          'Verifique se a conta está ativa e tem saldo',
          'Tente gerar um novo AppID no painel',
          'Entre em contato com o suporte da OpenPix',
          'Verifique se não há espaços ou caracteres especiais no .env.local'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 