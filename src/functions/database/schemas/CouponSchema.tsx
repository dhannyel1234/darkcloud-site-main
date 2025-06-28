import { Schema, model, models } from "mongoose";

const CouponSchema = new Schema({
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true }, // Valor do desconto em porcentagem (ex: 10 para 10%)
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null }, // Data de expiração (null = sem expiração)
    usageLimit: { type: Number, default: null }, // Limite de usos (null = ilimitado)
    usageCount: { type: Number, default: 0 }, // Contador de usos
    createdAt: { type: Date, default: Date.now }
}, { collection: 'coupons' });

delete models.Coupon;
const Coupon = models?.Coupon || model("Coupon", CouponSchema);

export default Coupon;