const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://darkcloud:9YZxZu4gl4oJtwWn@cluster0.xlm3ycp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Schema do Admin
const AdminSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    user_name: { type: String, required: true }
});

const Admin = mongoose.model('Admin', AdminSchema);

async function addAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB');

        // Criar novo admin
        const admin = new Admin({
            user_id: "971901593328967730",
            user_name: "_d_"
        });

        await admin.save();
        console.log('Admin adicionado com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB');
    }
}

addAdmin(); 