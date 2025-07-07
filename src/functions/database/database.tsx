import mongoose from "mongoose";
import { MongoClient } from 'mongodb';

// A string de conexão virá do .env
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Dhannyel:oAuilUABWvUNpDkp@darkcloud.4hy8j1l.mongodb.net/lanhouse?retryWrites=true&w=majority&appName=DarkCloud";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI não está definida no ambiente");
  throw new Error("Por favor, defina a variável de ambiente MONGODB_URI");
}

let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

// Cliente MongoDB
let mongoClient: MongoClient | null = null;

export async function connect() {
  try {
    // Verificar se já está conectado
    if (isConnected && mongoose.connection.readyState === 1 && mongoClient?.topology?.isConnected()) {
      console.log('✅ Já conectado ao MongoDB');
      return mongoose.connection;
    }

    connectionAttempts++;
    console.log(`🔄 Tentativa ${connectionAttempts} de ${MAX_RETRIES} de conectar ao MongoDB...`);
    
    // Primeiro, tentar conectar usando o MongoClient nativo
    if (!mongoClient || !mongoClient.topology?.isConnected()) {
      console.log('🔄 Iniciando conexão com MongoClient...');
      
      // Se já existe um cliente, tentar fechar primeiro
      if (mongoClient) {
        try {
          await mongoClient.close();
          console.log('✅ Conexão anterior fechada com sucesso');
        } catch (error) {
          console.warn('⚠️ Erro ao fechar conexão anterior:', error);
        }
      }
      
      mongoClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 60000,
        connectTimeoutMS: 45000,
        socketTimeoutMS: 45000,
      });
      
      await mongoClient.connect();
      console.log('✅ MongoClient conectado com sucesso');
      
      // Testar a conexão
      const adminDb = mongoClient.db().admin();
      await adminDb.ping();
      console.log('✅ Ping ao MongoDB respondido com sucesso');
    }
    
    // Se o mongoose já estiver conectado, desconectar primeiro
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✅ Conexão Mongoose anterior fechada');
    }
    
    // Agora conectar o Mongoose
    console.log('🔄 Configurando Mongoose...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true,
      autoIndex: true,
      maxConnecting: 10,
      heartbeatFrequencyMS: 10000
    });

    isConnected = true;
    console.log('✅ Mongoose conectado com sucesso');
    
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
    
    // Verificar se temos acesso ao banco e suas coleções
    try {
      if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.collections();
        console.log('📚 Coleções disponíveis:', collections.map(c => c.collectionName));
      } else {
        console.warn('⚠️ mongoose.connection.db não está disponível ainda');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao listar coleções:', error);
    }
    
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