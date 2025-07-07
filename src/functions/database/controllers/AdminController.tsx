import Database from "../database";
import Admin from "../schemas/AdminSchema";

// Create
const create = async (data: { user_id: string; user_name: string; }) => {
    try {
        console.log('🔄 Conectando ao banco para criar admin...');
        await Database.connect();
        console.log('✅ Conexão estabelecida');

        const { user_id, user_name } = data;
        console.log(`📝 Criando admin para usuário ${user_name} (${user_id})`);
        
        const db = new Admin({ user_id, user_name });
        const result = await db.save();
        console.log('✅ Admin criado com sucesso:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Erro ao criar admin:', error);
        throw error;
    }
};

// Read [Find by Email and ID]
const find = async (data: { user_id: string; }) => {
    try {
        console.log('🔄 Conectando ao banco para buscar admin...');
        await Database.connect();
        console.log('✅ Conexão estabelecida');

        const { user_id } = data;
        console.log(`🔍 Buscando admin com ID: ${user_id}`);
        
        const db = await Admin.findOne({ user_id }).maxTimeMS(5000).exec();
        console.log('🔍 Resultado da busca:', db);
        
        return db;
    } catch (error) {
        console.error('❌ Erro ao buscar admin:', error);
        throw error;
    }
};

// Read [Find All]
const findAll = async () => {
    try {
        console.log('🔄 Conectando ao banco para listar admins...');
        await Database.connect();
        console.log('✅ Conexão estabelecida');

        console.log('🔍 Buscando todos os admins...');
        const admins = await Admin.find({}, 'user_id user_name').maxTimeMS(5000).exec();
        console.log(`📊 ${admins.length} admins encontrados`);
        
        return admins;
    } catch (error) {
        console.error('❌ Erro ao listar admins:', error);
        throw error;
    }
};

// Remove (Delete)
const remove = async (data: { user_id: string; }) => {
    try {
        console.log('🔄 Conectando ao banco para remover admin...');
        await Database.connect();
        console.log('✅ Conexão estabelecida');

        const { user_id } = data;
        console.log(`🗑️ Removendo admin com ID: ${user_id}`);
        
        const result = await Admin.findOneAndDelete({ user_id }).maxTimeMS(5000).exec();
        console.log('🗑️ Resultado da remoção:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Erro ao remover admin:', error);
        throw error;
    }
};

const controller = {
    create,
    find,
    findAll,
    remove
};

export default controller;