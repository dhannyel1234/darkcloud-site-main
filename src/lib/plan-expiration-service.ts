import PlanExpirationChecker from './plan-expiration-checker';

export function initializePlanExpirationService() {
  const checker = PlanExpirationChecker.getInstance();
  
  // Iniciar verificação a cada 5 minutos
  checker.startChecking(300); // 300 segundos = 5 minutos

  // Garantir que o checker seja parado quando a aplicação for encerrada
  process.on('SIGTERM', () => {
    checker.stopChecking();
  });

  process.on('SIGINT', () => {
    checker.stopChecking();
  });
} 