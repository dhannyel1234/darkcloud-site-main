import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import queueController from '@/functions/database/controllers/QueueController';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Obter tipo do plano da query string
        const url = new URL(request.url);
        const planType = url.searchParams.get('planType');

        // Obter estatísticas da fila
        const result = await queueController.getQueueStats(planType || undefined);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao obter estatísticas da fila:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 