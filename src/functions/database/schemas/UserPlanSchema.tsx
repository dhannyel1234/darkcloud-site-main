import { Schema, model, models } from "mongoose";

const UserPlanSchema = new Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    planType: { type: String, enum: ['alfa', 'beta', 'omega', 'elite', 'plus', 'omega'], required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    activatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: function() { return this.planType !== 'alfa'; } }, // Só é obrigatório para planos não-Alfa
    chargeId: { type: String, required: true },
    paymentValue: { type: Number, required: true },
    isInQueue: { type: Boolean, default: false }, // Para plano Alfa que só conta quando entra na fila
    queueStartedAt: { type: Date, default: null }, // Quando entrou na fila (para plano Alfa)
    alfaTimeLeftMs: { type: Number, default: null }, // Tempo restante em ms para plano Alfa
    cancelDate: { type: Date },
    cancelReason: { type: String },
    expiredAt: { type: Date, default: null },
    lastQueueExit: { type: Date, default: null },
    redirectUrl: { type: String, default: null }, // URL para redirecionamento após pagamento
    isPremiumPlan: { type: Boolean, default: false } // Indica se é um plano premium (ELITE, PLUS, OMEGA)
}, { collection: 'user_plans' });

// Índice para buscar planos ativos por usuário
UserPlanSchema.index({ userId: 1, status: 1 });

// Middleware para definir se é plano premium
UserPlanSchema.pre('save', function(next) {
    const premiumPlans = ['elite', 'plus', 'omega'];
    this.isPremiumPlan = premiumPlans.includes(this.planType.toLowerCase());
    next();
});

delete models.UserPlan;
const UserPlan = models?.UserPlan || model("UserPlan", UserPlanSchema);

export default UserPlan; 