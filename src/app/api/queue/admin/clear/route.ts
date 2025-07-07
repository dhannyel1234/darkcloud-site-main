import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import database from '@/functions/database/database';
import Queue from '@/functions/database/schemas/QueueSchema';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    // Verificar se é admin
    try {
      const adminResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/get?user_id=${session.user.id}`);
      const adminData = await adminResponse.json();
      if (!adminData.isAdmin) {
        return NextResponse.json({ error: 'Acesso negado - Apenas administradores' }, { status: 403 });
      }
    } catch (adminError) {
      return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 });
    }
    await database.connect();
    // Remove todos os usuários aguardando (waiting)
    const result = await Queue.deleteMany({ status: 'waiting' });
    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao limpar filas' }, { status: 500 });
  }
} 