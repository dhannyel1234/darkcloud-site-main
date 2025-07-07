import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import database from '@/functions/database/database';
import Queue from '@/functions/database/schemas/QueueSchema';
import { QueueController } from '@/functions/database/controllers/QueueController';
import { UserPlanController } from '@/functions/database/controllers/UserPlanController';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Conectar ao banco
        await database.connect();

        // Remove o usuário da fila
        const result = await Queue.deleteOne({ 
            userId: session.user.id,
            status: 'waiting'
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ 
                error: 'Usuário não encontrado na fila ou não está aguardando' 
            }, { status: 404 });
        }

        console.log('DEBUG - Usuário saiu da fila:', {
            userId: session.user.id,
            userName: session.user.name
        });

        // Pausar tempo do plano Alfa, se for o caso
        await UserPlanController.pauseAlfaTime(session.user.id);

        return NextResponse.json({ 
            success: true, 
            message: 'Saiu da fila com sucesso' 
        });

    } catch (error) {
        console.error('Erro ao sair da fila:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 