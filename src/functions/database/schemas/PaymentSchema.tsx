import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema({
    custom_id: String,
    payment_id: String,
    email: String,
    plan: String,
    checked_all: Boolean,
    machine_created: Boolean,
    timeout_id: String,
    coupon_applied: { type: String, default: null },
    discount_percent: { type: Number, default: 0 }
}, { collection: 'payments' });

delete models.Payment;
const Payment = models?.Payment || model("Payment", PaymentSchema);

export default Payment;