import PlanExpirationChecker from './plan-expiration-checker';

// Inicializar o checker com intervalo de 1 segundo
const initializePlanChecker = () => {
  const checker = PlanExpirationChecker.getInstance();
  checker.startChecking(1); // 1 segundo de intervalo
  console.log('[PlanChecker] Iniciado com intervalo de 1 segundo');
};

export default initializePlanChecker; 