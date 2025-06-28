import Database from "../database";
import Payment from "../schemas/PaymentSchema";

// Create
const create = async (data: { custom_id: string; payment_id: string; email: string; plan: string; checked_all: boolean; machine_created: boolean; timeout_id: string; }) => {
    await Database.connect();

    const { custom_id, payment_id, email, plan, checked_all, machine_created, timeout_id } = data;
    const payment = new Payment({ custom_id, payment_id, email, plan, checked_all, machine_created, timeout_id });
    return await payment.save();
};

// Read [Find by Email and ID]
const find = async (data: { custom_id: string; }) => {
    await Database.connect();

    const { custom_id } = data;
    const payment = await Payment.findOne({ custom_id });
    return payment;
};

// Remove (Delete)
const remove = async (data: { custom_id: string; }) => {
    await Database.connect();
    
    const { custom_id } = data;
    return await Payment.findOneAndDelete({ custom_id });
};

// Update (Edit)
const update = async (data: { custom_id: string; updates: Partial<{ email: string; plan: string; checked_all: Boolean; machine_created: boolean; }> }) => {
    await Database.connect();

    const { custom_id, updates } = data;
    const payment = await Payment.findOneAndUpdate({ custom_id }, updates, { new: true });
    return payment;
};

const paymentController = {
    create,
    find,
    remove,
    update
};

export default paymentController;