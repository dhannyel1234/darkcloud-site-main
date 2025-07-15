import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AIConfigController } from '@/functions/database/controllers/AIConfigController';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é admin
    if (!session.user.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { key, value } = await request.json();

    if (!key || !value) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const config = await AIConfigController.set(key, value);
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao configurar IA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 