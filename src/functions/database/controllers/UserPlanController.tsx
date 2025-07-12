import Database from "../database";
import UserPlan from "../schemas/UserPlanSchema";
import { Document, Types } from 'mongoose';

interface IUserPlan extends Document {
  _id: Types.ObjectId;
  userId: string;
  userName: string;
  planType: 'alfa' | 'beta' | 'omega' | 'elite' | 'plus';
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
  redirectUrl?: string;
  isPremiumPlan: boolean;
}

export class UserPlanController {
  private static instance: UserPlanController;

  static getInstance(): UserPlanController {
    if (!UserPlanController.instance) {
      UserPlanController.instance = new UserPlanController();
    }
    return UserPlanController.instance;
  }

  async create(data: {
    userId: string;
    userName: string;
    planType: string;
    expiresAt: Date | null;
    chargeId: string;
    paymentValue: number;
    redirectUrl?: string;
  }) {
    await Database.connect();

    const { userId, userName, planType, expiresAt, chargeId, paymentValue, redirectUrl } = data;
    
    console.log('[create] Iniciando criação de plano com dados:', {
      userId,
      userName,
      planType,
      expiresAt,
      chargeId,
      paymentValue,
      redirectUrl
    });
    
    if (!userId || !userName || !planType) {
      console.error('[create] Dados incompletos:', data);
      throw new Error("Dados incompletos para criar o plano");
    }

    // Verificar se o tipo do plano é válido
    if (!['alfa', 'beta', 'omega', 'elite', 'plus'].includes(planType.toLowerCase())) {
      console.error('[create] Tipo de plano inválido:', planType);
      throw new Error("Tipo de plano inválido");
    }

    // Para planos premium (ELITE, PLUS, OMEGA), não precisam de data de expiração
    const isPremiumPlan = ['elite', 'plus', 'omega'].includes(planType.toLowerCase());
    if (!isPremiumPlan && planType.toLowerCase() !== 'alfa' && !expiresAt) {
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
      isPremiumPlan,
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
      // Para plano Alfa, definir tempo fixo de 1h20m (80 minutos)
      alfaTimeLeftMs = 80 * 60 * 1000; // 80 minutos em milissegundos
      finalExpiresAt = null; // Plano Alfa não usa expiresAt
      console.log('[create] Plano Alfa criado com tempo fixo de 1h20m');
    } else if (chargeId === 'manual-add') {
      // Para planos criados manualmente, usar a data de expiração fornecida
      finalExpiresAt = expiresAt;
      // Garantir que a data de expiração seja no final do dia para planos Omega
      if (planType.toLowerCase() === 'omega') {
        finalExpiresAt = new Date(finalExpiresAt.getFullYear(), finalExpiresAt.getMonth(), finalExpiresAt.getDate(), 23, 59, 59);
      }
      console.log('[create] Plano customizado criado manualmente com data de expiração:', finalExpiresAt);
    } else {
      // Para outros planos comprados, usar o tempo padrão
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
      isManual: chargeId === 'manual-add',
      isPremiumPlan,
      redirectUrl
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
      lastQueueExit: null,
      redirectUrl: redirectUrl || null
    });

    const savedPlan = await userPlan.save();
    console.log('[create] Plano criado com sucesso:', savedPlan);
    return savedPlan;
  }

  async hasActivePlan(userId: string, planType: string): Promise<IUserPlan | null> {
    await Database.connect();
    
    const currentDate = new Date();
    console.log('[hasActivePlan] Verificando plano ativo:', { userId, planType, currentDate });
    
    const query: any = {
      userId,
      planType: planType.toLowerCase(),
      status: 'active'
    };

    // Para planos premium, não verificar data de expiração
    const isPremiumPlan = ['elite', 'plus', 'omega'].includes(planType.toLowerCase());
    if (!isPremiumPlan) {
      if (planType.toLowerCase() === 'alfa') {
        // Para plano Alfa, verificar se tem tempo restante
        query.$or = [
          { alfaTimeLeftMs: { $gt: 0 } },
          { alfaTimeLeftMs: null }
        ];
      } else {
        // Para outros planos, verificar data de expiração
        query.expiresAt = { $gt: currentDate };
      }
    }

    console.log('[hasActivePlan] Query de busca:', query);
    
    const plan = await UserPlan.findOne(query).lean() as IUserPlan | null;
    console.log('[hasActivePlan] Resultado:', plan);
    
    return plan;
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
          // Para planos não-Alfa e não-premium, verificar data de expiração
          {
            planType: { $nin: ['alfa', 'elite', 'plus', 'omega'] },
            expiresAt: { $gt: currentDate }
          },
          // Para planos Alfa, verificar tempo restante ou se é um plano novo
          {
            planType: 'alfa',
            $or: [
              { alfaTimeLeftMs: { $gt: 0 } },
              { alfaTimeLeftMs: null }
            ]
          },
          // Para planos premium, não verificar data de expiração
          {
            planType: { $in: ['elite', 'plus', 'omega'] }
          }
        ]
      }).lean();

      console.log('[getActivePlans] Query de busca:', {
        status: 'active',
        $or: [
          {
            planType: { $nin: ['alfa', 'elite', 'plus', 'omega'] },
            expiresAt: { $gt: currentDate }
          },
          {
            planType: 'alfa',
            $or: [
              { alfaTimeLeftMs: { $gt: 0 } },
              { alfaTimeLeftMs: null }
            ]
          },
          {
            planType: { $in: ['elite', 'plus', 'omega'] }
          }
        ]
      });
      
      console.log('[getActivePlans] Planos encontrados:', JSON.stringify(plans, null, 2));
      
      return plans;
    } catch (error) {
      console.error('[getActivePlans] Erro ao buscar planos ativos:', error);
      throw error;
    }
  }

  async updateAlfaTime(userId: string, planType: string, timeLeftMs: number) {
    await Database.connect();
    
    console.log('[updateAlfaTime] Atualizando tempo do plano Alfa:', {
      userId,
      planType,
      timeLeftMs
    });
    
    const result = await UserPlan.findOneAndUpdate(
      { userId, planType: planType.toLowerCase(), status: 'active' },
      { alfaTimeLeftMs: timeLeftMs },
      { new: true }
    );
    
    console.log('[updateAlfaTime] Resultado:', result);
    return result;
  }

  async setQueueStatus(userId: string, planType: string, isInQueue: boolean) {
    await Database.connect();
    
    console.log('[setQueueStatus] Definindo status da fila:', {
      userId,
      planType,
      isInQueue
    });
    
    const updateData: any = { isInQueue };
    
    if (isInQueue) {
      updateData.queueStartedAt = new Date();
    } else {
      updateData.lastQueueExit = new Date();
    }
    
    const result = await UserPlan.findOneAndUpdate(
      { userId, planType: planType.toLowerCase(), status: 'active' },
      updateData,
      { new: true }
    );
    
    console.log('[setQueueStatus] Resultado:', result);
    return result;
  }

  async cancelPlan(userId: string, planType: string, reason: string) {
    await Database.connect();
    
    console.log('[cancelPlan] Cancelando plano:', {
      userId,
      planType,
      reason
    });
    
    const result = await UserPlan.findOneAndUpdate(
      { userId, planType: planType.toLowerCase(), status: 'active' },
      {
        status: 'cancelled',
        cancelDate: new Date(),
        cancelReason: reason,
        isInQueue: false
      },
      { new: true }
    );
    
    console.log('[cancelPlan] Resultado:', result);
    return result;
  }

  async expirePlan(userId: string, planType: string) {
    await Database.connect();
    
    console.log('[expirePlan] Expirando plano:', {
      userId,
      planType
    });
    
    const result = await UserPlan.findOneAndUpdate(
      { userId, planType: planType.toLowerCase(), status: 'active' },
      {
        status: 'expired',
        expiredAt: new Date(),
        isInQueue: false
      },
      { new: true }
    );
    
    console.log('[expirePlan] Resultado:', result);
    return result;
  }
}