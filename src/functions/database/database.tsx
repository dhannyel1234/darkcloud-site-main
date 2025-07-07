import mongoose from "mongoose";

// A string de conexão virá do .env
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Dhannyel:oAuilUABWvUNpDkp@darkcloud.4hy8j1l.mongodb.net/lanhouse?retryWrites=true&w=majority&appName=DarkCloud";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI não está definida no ambiente");
  throw new Error("Por favor, defina a variável de ambiente MONGODB_URI");
}

let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

export async function connect() {
  if (isConnected) {
    console.log('✅ Já conectado ao MongoDB');
    return mongoose.connection;
  }

  try {
    connectionAttempts++;
    console.log(`🔄 Tentativa ${connectionAttempts} de ${MAX_RETRIES} de conectar ao MongoDB...`);
    
    // Configurações de conexão
    const options = {
      serverSelectionTimeoutMS: 60000, // Aumentado para 60 segundos
      socketTimeoutMS: 45000,          // Aumentado para 45 segundos
      connectTimeoutMS: 45000,         // Aumentado para 45 segundos
      maxPoolSize: 20,                 // Aumentado pool máximo
      minPoolSize: 5,                  // Aumentado pool mínimo
      retryWrites: true,
      retryReads: true,
      keepAlive: true,
      keepAliveInitialDelay: 300000,   // 5 minutos
      autoIndex: true,
      maxConnecting: 10,
      heartbeatFrequencyMS: 10000,     // 10 segundos
    };

    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('✅ Conectado ao MongoDB com sucesso');
    
    // Configurar listeners de eventos
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Desconectado do MongoDB');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Reconectado ao MongoDB');
      isConnected = true;
    });
    
    // Listar todas as coleções para debug
    const collections = await mongoose.connection.db.collections();
    console.log('📚 Coleções disponíveis:', collections.map(c => c.collectionName));
    
    return mongoose.connection;
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`🔄 Aguardando 5 segundos antes de tentar novamente...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connect();
    }
    
    throw error;
  }
}

export async function connectToDatabase() {
  return connect();
}

const Database = {
  connect,
  connectToDatabase
};

export default Database;