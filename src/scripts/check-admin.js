const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://darkcloud:9YZxZu4gl4oJtwWn@cluster0.xlm3ycp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Schema do Admin
const AdminSchema = new mongoose.Schema({
    user_id: String,
    user_name: String
}, { collection: 'admins' });

const Admin = mongoose.model('Admin', AdminSchema);

async function checkAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB');

        // Buscar admin
        const admin = await Admin.findOne({ user_id: "971901593328967730" });
        console.log('Resultado da busca:', admin);

        if (!admin) {
            console.log('Admin não encontrado, tentando criar...');
            const newAdmin = new Admin({
                user_id: "971901593328967730",
                user_name: "_d_"
            });
            await newAdmin.save();
            console.log('Admin criado com sucesso!');
        }
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB');
    }
}

checkAdmin(); 