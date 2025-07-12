import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AIConfigController } from '@/functions/database/controllers/AIConfigController';
import { generateGeminiResponse } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensagem não fornecida' }, { status: 400 });
    }

    // Obter configurações da IA
    const configs = await AIConfigController.getAll();
    const configContext = configs.map(c => `${c.key}: ${c.value}`).join('\n');
    
    // Criar contexto para a IA
    const context = `Você é uma IA assistente. Use estas configurações para se comportar de acordo:\n${configContext}`;

    // Obter resposta do Gemini
    const response = await generateGeminiResponse(message, context);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Erro no chat com IA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 