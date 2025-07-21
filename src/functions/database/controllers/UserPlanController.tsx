import Database from "../database";
import UserPlan from "../schemas/UserPlanSchema";
import { Document, Types } from 'mongoose';

interface IUserPlan extends Document {
  _id: Types.ObjectId;
  userId: string;
  userName: string;
  planType: 'alfa' | 'beta' | 'omega';
  status: 'active' | 'expired' | 'cancelled';
  activatedAt: Date;
  expiresAt: Date;
  chargeId: string;
  paymentValue: number;
  isInQueue: boolean;
  queueStartedAt: Date | null;
  alfaTimeLeftMs: number | null;
  cancelDate?: Date;
  cancelReason?: string;
  expiredAt: Date | null;
  lastQueueExit: Date | null;
}

export class UserPlanController {
  private static instance: UserPlanController;

  private constructor() {}

  public static getInstance(): UserPlanController {
    if (!UserPlanController.instance) {
      UserPlanController.instance = new UserPlanController();
    }
    return UserPlanController.instance;
  }

  private validatePlanType(planType: string): planType is 'alfa' | 'beta' | 'omega' {
    const validTypes = ['alfa', 'beta', 'omega'];
    return validTypes.includes(planType.toLowerCase());
  }

  async create(data: {
    userId: string;
    userName: string;
    planType: string;
    expiresAt: Date | null;
    chargeId: string;
    paymentValue: number;
  }) {
    await Database.connect();

    const { userId, userName, planType, expiresAt, chargeId, paymentValue } = data;
    
    console.log('[create] Iniciando criação de plano com dados:', {
      userId,
      userName,
      planType,
      expiresAt,
      chargeId,
      paymentValue
    });
    
    if (!userId || !userName || !planType) {
      console.error('[create] Dados incompletos:', data);
      throw new Error("Dados incompletos para criar o plano");
    }

    // Verificar se o tipo do plano é válido
    if (!['alfa', 'beta', 'omega'].includes(planType.toLowerCase())) {
      console.error('[create] Tipo de plano inválido:', planType);
      throw new Error("Tipo de plano inválido");
    }

    // Validar expiresAt baseado no tipo do plano
    if (planType.toLowerCase() !== 'alfa' && !expiresAt) {
      console.error('[create] Data de expiração necessária para planos não-Alfa:', data);
      throw new Error("Data de expiração necessária para planos não-Alfa");
    }
    
    // Log para debug
    console.log('[create] Tentando criar plano:', {
      userId,
      userName,
      planType,
      expiresAt,
      chargeId,
      now: new Date(),
      isAlfaPlan: planType.toLowerCase() === 'alfa',
      isManualAdd: chargeId === 'manual-add'
    });
    
    // Verificar se já existe um plano ativo do mesmo tipo para o usuário
    const existingPlan = await UserPlan.findOne({
      userId,
      planType: planType.toLowerCase(),
      status: 'active'
    }).lean() as IUserPlan | null;

    if (existingPlan) {
      console.error('[create] Usuário já possui plano ativo:', existingPlan);
      throw new Error("Usuário já possui um plano ativo deste tipo");
    }

    // Calcular alfaTimeLeftMs para plano Alfa
    let alfaTimeLeftMs = null;
    let finalExpiresAt = expiresAt;

    if (planType.toLowerCase() === 'alfa') {
      // Se for um plano criado manualmente, usar o tempo especificado
      // Se for um plano comprado, usar o tempo padrão de 1h20m
      if (chargeId === 'manual-add') {
        // Para planos manuais, alfaTimeLeftMs é a duração total em milissegundos
        alfaTimeLeftMs = expiresAt.getTime() - new Date().getTime();
        // Ajustar a data de expiração para null já que o plano ainda não começou
        finalExpiresAt = null;
        console.log('[create] Plano Alfa criado manualmente com duração:', alfaTimeLeftMs / (1000 * 60), 'minutos');
      } else {
        alfaTimeLeftMs = 80 * 60 * 1000; // 1h20m em milissegundos
        finalExpiresAt = null; // Planos Alfa não usam expiresAt
        console.log('[create] Plano Alfa comprado com duração padrão de 1h20m');
      }
    } else if (chargeId === 'manual-add') {
      // Para planos Beta e Omega criados manualmente, usar a data de expiração fornecida
      finalExpiresAt = expiresAt;
      // Garantir que a data de expiração seja no final do dia para planos Omega
      if (planType.toLowerCase() === 'omega') {
        finalExpiresAt = new Date(finalExpiresAt.getFullYear(), finalExpiresAt.getMonth(), finalExpiresAt.getDate(), 23, 59, 59);
      }
      console.log('[create] Plano customizado criado manualmente com data de expiração:', finalExpiresAt);
    } else {
      // Para planos Beta e Omega comprados, usar o tempo padrão
      const now = new Date();
      if (planType.toLowerCase() === 'beta') {
        finalExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      } else if (planType.toLowerCase() === 'omega') {
        // Para Omega, definir a data de expiração para o final do último dia
        const daysToAdd = 30;
        finalExpiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        finalExpiresAt = new Date(finalExpiresAt.getFullYear(), finalExpiresAt.getMonth(), finalExpiresAt.getDate(), 23, 59, 59);
      }
    }

    // Log para debug
    console.log('[create] Dados finais do plano:', {
      planType,
      chargeId,
      expiresAtOriginal: expiresAt,
      finalExpiresAt,
      alfaTimeLeftMs,
      isManual: chargeId === 'manual-add'
    });

    // Criar novo plano
    const userPlan = new UserPlan({
      userId,
      userName,
      planType: planType.toLowerCase(),
      expiresAt: finalExpiresAt,
      chargeId: chargeId || 'manual-add',
      paymentValue: paymentValue || 0,
      activatedAt: new Date(),
      status: 'active',
      isInQueue: false,
      queueStartedAt: null,
      alfaTimeLeftMs,
      cancelDate: null,
      cancelReason: null,
      expiredAt: null,
      lastQueueExit: null
    });
    
    try {
      const savedPlan = await userPlan.save();
      console.log('[create] Plano criado com sucesso:', savedPlan);
      return savedPlan;
    } catch (error) {
      console.error('[create] Erro ao salvar plano:', error);
      throw error;
    }
  }

  async getActivePlans() {
    try {
      await Database.connect();
      
      const currentDate = new Date();
      console.log('[getActivePlans] Buscando planos ativos. Data atual:', currentDate);
      
      // Buscar planos ativos
      const plans = await UserPlan.find({
        status: 'active',
        $or: [
          // Para planos não-Alfa, verificar data de expiração
          {
            planType: { $ne: 'alfa' },
            expiresAt: { $gt: currentDate }
          },
          // Para planos Alfa, verificar tempo restante ou se é um plano novo
          {
            planType: 'alfa',
            $or: [
              { alfaTimeLeftMs: { $gt: 0 } },
              { alfaTimeLeftMs: null }
            ]
          }
        ]
      }).lean();

      console.log('[getActivePlans] Query de busca:', {
        status: 'active',
        $or: [
          {
            planType: { $ne: 'alfa' },
            expiresAt: { $gt: currentDate }
          },
          {
            planType: 'alfa',
            $or: [
              { alfaTimeLeftMs: { $gt: 0 } },
              { alfaTimeLeftMs: null }
            ]
          }
        ]
      });
      
      console.log('[getActivePlans] Planos encontrados:', JSON.stringify(plans, null, 2));

      return plans.map(plan => {
        let timeLeft = '';
        if (plan.planType === 'alfa') {
          if (plan.alfaTimeLeftMs === null) {
            timeLeft = '1h 20m (não iniciado)';
          } else {
            const hours = Math.floor(plan.alfaTimeLeftMs / (1000 * 60 * 60));
            const minutes = Math.floor((plan.alfaTimeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((plan.alfaTimeLeftMs % (1000 * 60)) / 1000);
            timeLeft = `${hours}h ${minutes}m ${seconds}s`;
          }
        }

        return {
          id: plan._id.toString(),
          userId: plan.userId || "Sem ID",
          userName: plan.userName || "Usuário Desconhecido",
          planType: plan.planType,
          startDate: plan.activatedAt,
          endDate: plan.expiresAt,
          status: plan.status,
          alfaTimeLeftMs: plan.alfaTimeLeftMs,
          timeLeft: timeLeft
        };
      });
    } catch (error) {
      console.error("[getActivePlans] Erro ao buscar planos ativos:", error);
      throw new Error("Falha ao buscar planos ativos");
    }
  }

  async getAllActivePlans() {
    try {
      await Database.connect();
      
      // Buscar apenas planos ativos que não estão expirados
      const plans = await UserPlan.find({
        status: 'active',
        expiresAt: { $gt: new Date() }
      }).lean();

      return plans.map(plan => ({
        id: plan._id.toString(),
        userId: plan.userId || "Sem ID",
        userName: plan.userName || "Usuário Desconhecido",
        planType: plan.planType,
        startDate: plan.activatedAt,
        endDate: plan.expiresAt,
        status: plan.status
      }));
    } catch (error) {
      console.error("Erro ao buscar todos os planos ativos:", error);
      throw new Error("Falha ao buscar todos os planos ativos");
    }
  }

  async getExpiredPlans() {
    try {
      await Database.connect();
      
      console.log('[getExpiredPlans] Buscando planos expirados');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Buscar planos com status 'expired' dos últimos 30 dias e também planos ativos que já expiraram
      const plans = await UserPlan.find({
        $or: [
          { 
            status: 'expired',
            expiredAt: { $gte: thirtyDaysAgo }
          },
          {
            status: 'active',
            expiresAt: { $lte: new Date() }
          }
        ]
      })
      .sort({ expiresAt: -1 }) // Ordenar por data de expiração, mais recentes primeiro
      .lean();

      console.log(`[getExpiredPlans] Encontrados ${plans.length} planos expirados`);

      const formattedPlans = plans.map(plan => {
        const diasExpirado = Math.floor((new Date().getTime() - new Date(plan.expiresAt).getTime()) / (1000 * 60 * 60 * 24));
        
        const formattedPlan = {
          id: plan._id.toString(),
          userId: plan.userId || 'N/A',
          userName: plan.userName || 'N/A',
          planType: plan.planType,
          startDate: plan.activatedAt,
          endDate: plan.expiresAt,
          status: 'expired', // Forçar status como expirado para exibição
          expiredAt: plan.expiredAt || plan.expiresAt,
          diasExpirado: diasExpirado,
          expiredAtFormatted: new Date(plan.expiredAt || plan.expiresAt).toLocaleString('pt-BR')
        };

        console.log('[getExpiredPlans] Plano formatado:', formattedPlan);
        return formattedPlan;
      });

      return formattedPlans;
    } catch (error) {
      console.error("[getExpiredPlans] Erro ao buscar planos expirados:", error);
      throw new Error("Falha ao buscar planos expirados");
    }
  }

  async getCancelledPlans() {
    try {
      await Database.connect();
      
      const plans = await UserPlan.find({
        status: 'cancelled'
      }).lean();

      return plans.map(plan => ({
        id: plan._id.toString(),
        userId: plan.userId || 'N/A',
        userName: plan.userName || 'N/A',
        planType: plan.planType,
        startDate: plan.activatedAt,
        endDate: plan.expiresAt,
        status: plan.status,
        cancelDate: plan.cancelDate,
        cancelReason: plan.cancelReason
      }));
    } catch (error) {
      console.error("Erro ao buscar planos cancelados:", error);
      throw new Error("Falha ao buscar planos cancelados");
    }
  }

  async deactivatePlan(userId: string, reason: string) {
    try {
      await Database.connect();
      
      // Primeiro, buscar o plano para saber seu tipo
      const existingPlan = await UserPlan.findOne({
        userId,
        status: { $in: ['active', 'expired'] }
      }).lean() as IUserPlan | null;

      if (!existingPlan) {
        throw new Error("Plano não encontrado");
      }

      console.log('[deactivatePlan] Cancelando plano:', {
        userId,
        planType: existingPlan.planType,
        oldStatus: existingPlan.status,
        reason
      });

      // Atualizar o plano para cancelado
      const plan = await UserPlan.findOneAndUpdate(
        { 
          _id: existingPlan._id,
          status: { $in: ['active', 'expired'] }
        },
        { 
          $set: {
            status: 'cancelled',
            cancelDate: new Date(),
            cancelReason: reason,
            isInQueue: false,
            queueStartedAt: null,
            alfaTimeLeftMs: 0 // Zerar o tempo restante
          }
        },
        { new: true }
      ).lean() as IUserPlan | null;

      if (!plan) {
        console.error('[deactivatePlan] Falha ao atualizar plano:', {
          userId,
          planType: existingPlan.planType,
          oldStatus: existingPlan.status
        });
        throw new Error("Falha ao atualizar o plano");
      }

      // Remover da fila se estiver nela
      const Queue = (await import('@/functions/database/schemas/QueueSchema')).default;
      await Queue.deleteOne({ userId });

      console.log('[deactivatePlan] Plano cancelado com sucesso:', {
        userId,
        planType: plan.planType,
        oldStatus: existingPlan.status,
        newStatus: plan.status,
        reason
      });

      return plan;
    } catch (error) {
      console.error("[deactivatePlan] Erro ao desativar plano:", error);
      throw new Error("Falha ao desativar plano");
    }
  }

  async hasActivePlan(userId: string, planType: string) {
    await Database.connect();
    
    const currentDate = new Date();
    const plan = await UserPlan.findOne({
      userId,
      planType: planType.toLowerCase(),
      status: 'active',
      $or: [
        { expiresAt: { $gt: currentDate } },
        { 
          planType: 'alfa',
          expiresAt: null,
          alfaTimeLeftMs: { $gt: 0 }
        }
      ]
    }).lean() as IUserPlan | null;

    console.log('[hasActivePlan] Verificando plano:', {
      userId,
      planType,
      planFound: !!plan,
      planDetails: plan
    });

    return !!plan;
  }

  async markAsInQueue(userId: string, planType: string) {
    await Database.connect();
    
    const plan = await UserPlan.findOne({
      userId,
      planType: planType.toLowerCase(),
      status: 'active'
    }).lean() as IUserPlan | null;

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    await UserPlan.updateOne(
      { _id: plan._id },
      { 
        $set: { 
          isInQueue: true,
          queueStartedAt: new Date()
        }
      }
    );

    return true;
  }

  async markAsOutOfQueue(userId: string, planType: string) {
    await Database.connect();
    
    const plan = await UserPlan.findOne({
      userId,
      planType: planType.toLowerCase(),
      status: 'active'
    }).lean() as IUserPlan | null;

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    // Calcular tempo restante
    if (plan.queueStartedAt) {
      const now = new Date();
      const timeInQueue = now.getTime() - plan.queueStartedAt.getTime();
      const timeLeft = (plan.alfaTimeLeftMs || 0) - timeInQueue;

      await UserPlan.updateOne(
        { _id: plan._id },
        { 
          $set: { 
            isInQueue: false,
            queueStartedAt: null,
            alfaTimeLeftMs: Math.max(0, timeLeft),
            lastQueueExit: now
          }
        }
      );
    }

    return true;
  }

  async expireOldPlans() {
    try {
      await Database.connect();
      
      const now = new Date();
      
      // Buscar planos ativos que já expiraram
      const expiredPlans = await UserPlan.find({
        status: 'active',
        expiresAt: { $lte: now }
      });

      if (expiredPlans.length > 0) {
        console.log(`[expireOldPlans] Encontrados ${expiredPlans.length} planos para expirar`);
        
        // Atualizar todos os planos expirados de uma vez
        const updateResult = await UserPlan.updateMany(
          {
            _id: { $in: expiredPlans.map(plan => plan._id) }
          },
          {
            $set: {
              status: 'expired',
              expiredAt: now // Adicionar data de expiração
            }
          }
        );

        console.log('[expireOldPlans] Planos atualizados:', updateResult);
        return updateResult;
      }

      return null;
    } catch (error) {
      console.error('[expireOldPlans] Erro ao expirar planos:', error);
      throw error;
    }
  }

  async findPlan(userId: string, planType: string) {
    await Database.connect();
    
    return await UserPlan.findOne({
      userId,
      planType: planType.toLowerCase(),
      status: 'active'
    }).lean() as IUserPlan | null;
  }

  async deletePlan(userId: string, planType: string) {
    if (!this.validatePlanType(planType)) {
      throw new Error("Tipo de plano inválido");
    }

    await Database.connect();
    
    const plan = await UserPlan.findOne({
      userId,
      planType: planType.toLowerCase(),
      status: 'cancelled'
    }).lean() as IUserPlan | null;

    if (!plan) {
      throw new Error("Plano não encontrado ou não está cancelado");
    }

    // Remover o plano
    await UserPlan.deleteOne({
      _id: plan._id
    });

    return true;
  }
}

export default UserPlanController.getInstance();