import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import database from '@/functions/database/database';
import Queue from '@/functions/database/schemas/QueueSchema';

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

        // Conectar ao banco
        try {
            await database.connect();
        } catch (dbError) {
            console.error('Erro ao conectar ao banco:', dbError);
            return NextResponse.json({ error: 'Erro de conexão com banco de dados' }, { status: 500 });
        }

        // DEBUG: Mostrar todos os usuários na fila
        try {
            const allQueue = await Queue.find({}).lean();
            console.log('DEBUG - Todos na fila:', JSON.stringify(allQueue, null, 2));
        } catch (findError) {
            console.error('Erro ao buscar todos na fila:', findError);
        }

        // Estatísticas por plano
        const stats = await Queue.aggregate([
            {
                $group: {
                    _id: {
                        planType: '$plan.type',
                        status: '$status'
                    },
                    count: { $sum: 1 },
                    users: {
                        $push: {
                            userId: '$userId',
                            userName: '$userName',
                            userEmail: '$userEmail',
                            userImage: '$userImage',
                            position: '$position',
                            joinedAt: '$joinedAt',
                            activatedAt: '$activatedAt',
                            machineInfo: '$machineInfo'
                        }
                    }
                }
            }
        ]);

        console.log('DEBUG - Resultado da agregação:', JSON.stringify(stats, null, 2));

        // Formatar dados
        const formattedStats: any = {
            alfa: { waiting: 0, active: 0, users: [], activeUsers: [] },
            omega: { waiting: 0, active: 0, users: [], activeUsers: [] },
            beta: { waiting: 0, active: 0, users: [], activeUsers: [] }
        };

        stats.forEach((plan: any) => {
            const planType = plan._id.planType;
            const status = plan._id.status;
            
            if (formattedStats[planType]) {
                formattedStats[planType][status] = plan.count;
                
                if (status === 'waiting') {
                    formattedStats[planType].users = plan.users.sort((a: any, b: any) => a.position - b.position);
                } else if (status === 'active') {
                    formattedStats[planType].activeUsers = plan.users.map(u => ({
                        userId: u.userId,
                        userName: u.userName,
                        userEmail: u.userEmail,
                        userImage: u.userImage,
                        position: u.position,
                        joinedAt: u.joinedAt,
                        activatedAt: u.activatedAt,
                        machineInfo: {
                            ip: u.machineInfo?.ip,
                            user: u.machineInfo?.user,
                            password: u.machineInfo?.password,
                            name: u.machineInfo?.name,
                            connectLink: u.machineInfo?.connectLink
                        }
                    }));
                }
            }
        });

        console.log('DEBUG - Estatísticas formatadas:', JSON.stringify(formattedStats, null, 2));

        return NextResponse.json({ 
            success: true, 
            stats: formattedStats 
        });

    } catch (error) {
        console.error('Erro geral na rota de estatísticas:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
} 