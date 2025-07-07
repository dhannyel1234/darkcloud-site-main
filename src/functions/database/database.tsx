import mongoose from "mongoose";

// A string de conexão virá do .env
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Dhannyel:oAuilUABWvUNpDkp@darkcloud.4hy8j1l.mongodb.net/lanhouse?retryWrites=true&w=majority&appName=DarkCloud";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI não está definida no ambiente");
  throw new Error("Por favor, defina a variável de ambiente MONGODB_URI");
}

let isConnected = false;

export async function connect() {
  if (isConnected) {
    console.log('✅ Já conectado ao MongoDB');
    return;
  }

  try {
    console.log('🔄 Tentando conectar ao MongoDB...');
    
    // Configurações de conexão
    const options = {
      serverSelectionTimeoutMS: 30000, // Timeout de 30 segundos
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true
    };

    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('✅ Conectado ao MongoDB com sucesso');
    
    // Listar todas as coleções para debug
    const collections = await mongoose.connection.db.collections();
    console.log('📚 Coleções disponíveis:', collections.map(c => c.collectionName));
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    throw error;
  }
}

const Database = {
  connect
};

export default Database;