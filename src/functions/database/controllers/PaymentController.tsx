import Database from "../database";
import Payment from "../schemas/PaymentSchema";

// Create
const create = async (data: any) => {
    try {
        await Database.connect();
        const payment = new Payment(data);
        const result = await payment.save();
        console.log('✅ Pagamento salvo:', result);
        return result;
    } catch (error) {
        console.error('❌ Erro ao salvar pagamento:', error);
        throw error;
    }
};

// Read [Find by Email and ID]
const find = async (data: { custom_id: string; }) => {
    try {
        await Database.connect();
        const { custom_id } = data;
        const payment = await Payment.findOne({ custom_id }).exec();
        return payment;
    } catch (error) {
        console.error('❌ Erro ao buscar pagamento:', error);
        throw error;
    }
};

// Remove (Delete)
const remove = async (data: { custom_id: string; }) => {
    try {
        await Database.connect();
        const { custom_id } = data;
        return await Payment.findOneAndDelete({ custom_id }).exec();
    } catch (error) {
        console.error('❌ Erro ao remover pagamento:', error);
        throw error;
    }
};

// Update (Edit)
const update = async (customId: string, updates: any) => {
    try {
        await Database.connect();
        console.log('📝 Atualizando pagamento:', { customId, updates });
        const payment = await Payment.findOneAndUpdate(
            { custom_id: customId },
            updates,
            { new: true }
        ).exec();
        console.log('✅ Pagamento atualizado:', payment);
        return payment;
    } catch (error) {
        console.error('❌ Erro ao atualizar pagamento:', error);
        throw error;
    }
};

const paymentController = {
    create,
    find,
    remove,
    update
};

export default paymentController;