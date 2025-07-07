import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import queueController from '@/functions/database/controllers/QueueController';

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
            console.error('Erro ao verificar admin:', adminError);
            return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 });
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
        }

        const result = await queueController.completeUserSession(userId);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Sessão finalizada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao finalizar sessão:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 