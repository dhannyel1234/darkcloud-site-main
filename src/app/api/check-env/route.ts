import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const appId = process.env.OPENPIX_APP_ID;
    
    if (!appId) {
      return NextResponse.json({
        error: 'OPENPIX_APP_ID não configurado',
        message: 'Verifique se o arquivo .env.local existe e contém OPENPIX_APP_ID'
      });
    }

    // Verificar se o AppID está sendo lido corretamente
    const appIdLength = appId.length;
    const hasQuotes = appId.startsWith('"') && appId.endsWith('"');
    const cleanAppId = hasQuotes ? appId.slice(1, -1) : appId;
    
    // Verificar se é Base64 válido
    let isValidBase64 = false;
    let decodedContent = '';
    
    try {
      decodedContent = atob(cleanAppId);
      isValidBase64 = true;
    } catch (error) {
      isValidBase64 = false;
    }

    return NextResponse.json({
      success: true,
      appIdInfo: {
        original: appId,
        length: appIdLength,
        hasQuotes: hasQuotes,
        cleanAppId: cleanAppId,
        isValidBase64: isValidBase64,
        decodedContent: decodedContent,
        headerToUse: `App ${cleanAppId}`
      },
      message: 'AppID lido do arquivo .env.local'
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar AppID',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 