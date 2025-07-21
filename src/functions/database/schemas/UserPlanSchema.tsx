import { Schema, model, models } from "mongoose";

const UserPlanSchema = new Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    planType: { type: String, enum: ['alfa', 'beta', 'omega'], required: true },
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
    lastQueueExit: { type: Date, default: null }
}, { collection: 'user_plans' });

// Índice para buscar planos ativos por usuário
UserPlanSchema.index({ userId: 1, status: 1 });
UserPlanSchema.index({ userId: 1, planType: 1 });

delete models.UserPlan;
const UserPlan = models?.UserPlan || model("UserPlan", UserPlanSchema);

export default UserPlan; 