import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema({
    custom_id: String,
    payment_id: String, // txid do EFI
    email: String,
    plan: String,
    checked_all: Boolean,
    machine_created: Boolean,
    timeout_id: String,
    coupon_applied: { type: String, default: null },
    discount_percent: { type: Number, default: 0 },
    brCode: { type: String, default: null },
    qrCodeImage: { type: String, default: null },
    price: { type: Number, default: 0 },
    userId: { type: String, required: true }, // ID do Discord
    userName: { type: String, required: true }, // Nome do usuário do Discord
    status: { type: String, default: 'pending' }, // Status do pagamento
    created_at: { type: Date, default: Date.now }, // Data de criação
    updated_at: { type: Date, default: Date.now }, // Data de atualização
    expires_at: { type: Date }, // Data de expiração do QR Code
}, { collection: 'payments' });

// Middleware para atualizar o updated_at
PaymentSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

delete models.Payment;
const Payment = models?.Payment || model("Payment", PaymentSchema);

export default Payment;