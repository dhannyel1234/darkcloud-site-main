import Queue from '../schemas/QueueSchema';
import QueueMachine from '../schemas/QueueMachineSchema';
import { UserPlanController } from './UserPlanController';
import UserPlan from '../schemas/UserPlanSchema';

export class QueueController {
    private static instance: QueueController;
    private userPlanController: UserPlanController;

    private constructor() {
        this.userPlanController = UserPlanController.getInstance();
    }

    public static getInstance(): QueueController {
        if (!QueueController.instance) {
            QueueController.instance = new QueueController();
        }
        return QueueController.instance;
    }

    // Entrar na fila
    async joinQueue(userId: string, userName: string, userEmail: string, userImage: string, planType: string) {
        try {
            // Verificar se o usuário já está na fila
            const existingUser = await Queue.findOne({ userId, status: { $in: ['waiting', 'active'] } });
            if (existingUser) {
                return { success: false, message: 'Usuário já está na fila' };
            }

            // Buscar o plano do usuário
            const userPlan = await this.userPlanController.findPlan(userId, planType);
            if (!userPlan) {
                return { success: false, message: 'Plano não encontrado' };
            }

            // Definir duração e tempo baseado no plano existente
            let duration = 0;
            let planName = '';
            let endTime = null;
            const now = new Date();
            
            if (planType.toLowerCase() === 'alfa') {
                // Para plano Alfa, usar alfaTimeLeftMs
                duration = Math.floor((userPlan.alfaTimeLeftMs || 0) / 60000); // Converter ms para minutos
                endTime = new Date(now.getTime() + (userPlan.alfaTimeLeftMs || 0));
                planName = 'Alfa';

                // Atualizar o plano para marcar que está na fila
                await UserPlan.updateOne(
                    { _id: userPlan._id },
                    { 
                        $set: { 
                            isInQueue: true,
                            queueStartedAt: now,
                            expiresAt: endTime
                        }
                    }
                );
            } else {
                // Para Beta e Omega, usar a data de expiração do plano
                endTime = userPlan.expiresAt;
                // Calcular duração em minutos
                duration = Math.floor((endTime.getTime() - now.getTime()) / 60000);
                planName = planType.charAt(0).toUpperCase() + planType.slice(1).toLowerCase();
            }

            // Log para debug
            console.log('DEBUG - Entrando na fila:', {
                userId,
                planType,
                duration,
                endTime: endTime?.toISOString(),
                planName,
                userPlanExpiresAt: userPlan.expiresAt?.toISOString(),
                now: now.toISOString(),
                durationInDays: duration / (24 * 60) // Converter minutos para dias
            });

            // Criar entrada na fila
            const queueEntry = new Queue({
                userId,
                userName,
                userEmail,
                userImage,
                status: 'waiting',
                plan: {
                    name: planName,
                    type: planType,
                    duration,
                    startTime: now,
                    endTime
                },
                joinedAt: now,
                position: await this.getNextPosition()
            });

            await queueEntry.save();
            return { success: true, message: 'Entrou na fila com sucesso' };
        } catch (error) {
            console.error('Erro ao entrar na fila:', error);
            return { success: false, message: 'Erro ao entrar na fila' };
        }
    }

    private async getNextPosition(): Promise<number> {
        const lastInQueue = await Queue.findOne({ status: 'waiting' }, {}, { sort: { position: -1 } });
        return lastInQueue ? lastInQueue.position + 1 : 1;
    }

    // Obter posição na fila
    async getQueuePosition(userId: string) {
        try {
            const userInQueue = await Queue.findOne({ userId, status: { $in: ['waiting', 'active'] } });
            if (!userInQueue) {
                return { success: false, message: 'Usuário não está na fila' };
            }

            return { 
                success: true, 
                position: userInQueue.position,
                status: userInQueue.status,
                plan: userInQueue.plan
            };
        } catch (error) {
            console.error('Erro ao obter posição na fila:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    // Obter próximo da fila (para admin)
    async getNextInQueue() {
        try {
            const nextUser = await Queue.findOne({ status: 'waiting' }, {}, { sort: { position: 1 } });
            if (!nextUser) {
                return { success: false, message: 'Não há usuários na fila' };
            }

            return { success: true, user: nextUser };
        } catch (error) {
            console.error('Erro ao obter próximo da fila:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    // Ativar usuário da fila (para admin)
    async activateUser(userId: string, machineInfo: { ip: string, user: string, password: string, name: string, connectLink: string }) {
        try {
            const userInQueue = await Queue.findOne({ userId, status: 'waiting' });
            if (!userInQueue) {
                return { success: false, message: 'Usuário não encontrado na fila' };
            }

            // Verificar plano Alfa
            if (userInQueue.plan.type === 'alfa') {
                const userPlan = await UserPlan.findOne({ userId, planType: 'alfa', status: 'active' });
                if (!userPlan) {
                    return { success: false, message: 'Plano Alfa não encontrado' };
                }

                // Se alfaTimeLeftMs não estiver definido, define com tempo padrão
                if (userPlan.alfaTimeLeftMs === null || userPlan.alfaTimeLeftMs === undefined) {
                    userPlan.alfaTimeLeftMs = 2 * 60 * 60 * 1000; // 2 horas em milissegundos
                }

                // Verifica se tem tempo restante
                if (userPlan.alfaTimeLeftMs <= 0) {
                    return { success: false, message: 'Plano Alfa sem tempo restante' };
                }

                // Define o tempo de expiração baseado no tempo restante
                const startTime = new Date();
                const endTime = new Date(startTime.getTime() + userPlan.alfaTimeLeftMs);

                userInQueue.status = 'active';
                userInQueue.activatedAt = startTime;
                userInQueue.plan.startTime = startTime;
                userInQueue.plan.endTime = endTime;
                userInQueue.machineInfo = machineInfo;

                // Atualiza o plano para marcar como em uso e iniciar a contagem
                userPlan.isInQueue = true;
                userPlan.queueStartedAt = startTime;
                userPlan.expiresAt = endTime; // Define a expiração real
                userPlan.alfaTimeLeftMs = null;
                await userPlan.save();
            } else {
                // Para outros planos, apenas ativa na fila
                userInQueue.status = 'active';
                userInQueue.activatedAt = new Date();
                userInQueue.machineInfo = machineInfo;
            }

            await userInQueue.save();

            // Atualizar posições dos usuários restantes na fila
            await this.updateQueuePositions();

            return { success: true, message: 'Usuário ativado com sucesso', userInQueue };
        } catch (error) {
            console.error('Erro ao ativar usuário:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    // Finalizar sessão do usuário
    async completeUserSession(userId: string) {
        try {
            const userInQueue = await Queue.findOne({ userId, status: 'active' });
            if (!userInQueue) {
                return { success: false, message: 'Usuário não encontrado ou não está ativo' };
            }

            userInQueue.status = 'completed';
            userInQueue.completedAt = new Date();

            await userInQueue.save();

            // Se for plano Alfa, pausar o tempo
            if (userInQueue.plan.type === 'alfa') {
                await this.userPlanController.markAsOutOfQueue(userId, 'alfa');
            }

            // Liberar máquina
            if (userInQueue.machineInfo?.ip) {
                await QueueMachine.findOneAndUpdate(
                    { ip: userInQueue.machineInfo.ip },
                    { status: 'available', currentUserId: null }
                );
            }

            // Atualizar posições dos usuários restantes na fila
            await this.updateQueuePositions();

            return { success: true, message: 'Sessão finalizada com sucesso' };
        } catch (error) {
            console.error('Erro ao finalizar sessão:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    // Obter todas as máquinas da fila
    async getAllQueueMachines() {
        try {
            const machines = await QueueMachine.find({});
            return { success: true, machines };
        } catch (error) {
            console.error('Erro ao obter máquinas da fila:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    // Adicionar máquina à fila
    async addQueueMachine(name: string, ip: string, user: string, password: string) {
        try {
            const existingMachine = await QueueMachine.findOne({ ip });
            if (existingMachine) {
                return { success: false, message: 'Máquina já existe' };
            }

            const machine = new QueueMachine({
                name,
                ip,
                user,
                password,
                status: 'available'
            });

            await machine.save();
            return { success: true, message: 'Máquina adicionada com sucesso' };
        } catch (error) {
            console.error('Erro ao adicionar máquina:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    // Remover máquina da fila
    async removeQueueMachine(ip: string) {
        try {
            const machine = await QueueMachine.findOneAndDelete({ ip });
            if (!machine) {
                return { success: false, message: 'Máquina não encontrada' };
            }

            return { success: true, message: 'Máquina removida com sucesso' };
        } catch (error) {
            console.error('Erro ao remover máquina:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    // Obter estatísticas da fila
    async getQueueStats(planType?: string) {
        try {
            const baseQuery = planType ? { 'plan.type': planType } : {};
            
            // Buscar usuários aguardando
            const waitingUsers = await Queue.find({ ...baseQuery, status: 'waiting' });
            const validWaitingUsers = [];
            
            // Verificar planos ativos dos usuários aguardando
            for (const user of waitingUsers) {
                const hasActivePlan = await this.userPlanController.hasActivePlan(user.userId, user.plan.type);
                if (hasActivePlan) {
                    validWaitingUsers.push(user);
                } else {
                    // Remover da fila se não tiver plano ativo
                    await Queue.deleteOne({ _id: user._id });
                }
            }
            
            // Buscar usuários ativos
            const activeUsers = await Queue.find({ ...baseQuery, status: 'active' })
                .select('userId userName userEmail userImage plan machineInfo')
                .sort({ activatedAt: -1 });
            
            const validActiveUsers = [];
            
            // Verificar planos ativos dos usuários ativos
            for (const user of activeUsers) {
                const hasActivePlan = await this.userPlanController.hasActivePlan(user.userId, user.plan.type);
                if (hasActivePlan) {
                    validActiveUsers.push(user);
                } else {
                    // Remover da fila se não tiver plano ativo
                    await Queue.deleteOne({ _id: user._id });
                }
            }
            
            return {
                success: true,
                waiting: validWaitingUsers.length,
                active: validActiveUsers
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    // Atualizar posições na fila
    async updateQueuePositions() {
        try {
            // Buscar todos os usuários aguardando, ordenados por posição
            const waitingUsers = await Queue.find({ status: 'waiting' }).sort({ position: 1 });
            
            // Atualizar posição de cada usuário
            for (let i = 0; i < waitingUsers.length; i++) {
                const user = waitingUsers[i];
                if (user.position !== i + 1) {
                    await Queue.updateOne(
                        { _id: user._id },
                        { $set: { position: i + 1 } }
                    );
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar posições na fila:', error);
        }
    }
}

// Exportar a instância singleton
const queueController = QueueController.getInstance();
export default queueController; 