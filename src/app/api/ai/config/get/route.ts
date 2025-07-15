import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AIConfigController } from '@/functions/database/controllers/AIConfigController';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const value = await AIConfigController.get(key);
      return NextResponse.json({ value });
    }

    const configs = await AIConfigController.getAll();
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Erro ao obter configurações da IA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 