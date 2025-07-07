import { UserPlanController } from '@/functions/database/controllers/UserPlanController';
import Database from '@/functions/database/database';
import UserPlan from '@/functions/database/schemas/UserPlanSchema';

class PlanExpirationChecker {
  private static instance: PlanExpirationChecker;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;

  private constructor() {}

  public static getInstance(): PlanExpirationChecker {
    if (!PlanExpirationChecker.instance) {
      PlanExpirationChecker.instance = new PlanExpirationChecker();
    }
    return PlanExpirationChecker.instance;
  }

  private isExpired(expirationDate: Date, now: Date): boolean {
    return expirationDate <= now;
  }

  public async checkExpiredPlans() {
    if (this.isChecking) return;
    
    try {
      this.isChecking = true;
      await Database.connect();
      
      // Buscar apenas planos ativos diretamente
      const activePlans = await UserPlan.find({
        status: 'active'
      }).lean();

      const now = new Date();
      let hasExpiredPlans = false;

      for (const plan of activePlans) {
        const expirationDate = new Date(plan.expiresAt);
        
        // Verificar expiração
        if (this.isExpired(expirationDate, now)) {
          hasExpiredPlans = true;
          console.log(`[checkExpiredPlans] Plano encontrado para expirar:`, {
            userId: plan.userId,
            userName: plan.userName,
            planType: plan.planType,
            expiresAt: expirationDate.toLocaleString(),
            now: now.toLocaleString()
          });
        }
      }

      // Se houver planos expirados, atualizar todos de uma vez
      if (hasExpiredPlans) {
        try {
          const userPlanController = new UserPlanController();
          await userPlanController.expireOldPlans();
          console.log('[checkExpiredPlans] Planos expirados foram atualizados com sucesso');
        } catch (error) {
          console.error('[checkExpiredPlans] Erro ao atualizar planos expirados:', error);
        }
      }
    } catch (error) {
      console.error('[checkExpiredPlans] Erro ao verificar planos expirados:', error);
    } finally {
      this.isChecking = false;
    }
  }

  public startChecking(intervalSeconds: number = 300) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Converter segundos para milissegundos
    const interval = intervalSeconds * 1000;

    // Executar imediatamente a primeira verificação
    this.checkExpiredPlans();

    // Configurar o intervalo para verificações periódicas
    this.checkInterval = setInterval(() => {
      this.checkExpiredPlans();
    }, interval);

    console.log(`[startChecking] Verificador de expiração de planos iniciado - Intervalo: ${intervalSeconds} segundo(s)`);
  }

  public stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[stopChecking] Verificador de expiração de planos parado');
    }
  }
}

export default PlanExpirationChecker; 