import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import queueController from '@/functions/database/controllers/QueueController';

export async function GET(request: NextRequest) {
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

        const result = await queueController.getAllQueueMachines();
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao obter máquinas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

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

        const { name, ip, user, password } = await request.json();

        if (!name || !ip || !user || !password) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        const result = await queueController.addQueueMachine(name, ip, user, password);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao adicionar máquina:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
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

        const { ip } = await request.json();

        if (!ip) {
            return NextResponse.json({ error: 'IP não fornecido' }, { status: 400 });
        }

        const result = await queueController.removeQueueMachine(ip);
        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao remover máquina:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 