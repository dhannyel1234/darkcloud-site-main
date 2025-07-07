import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://DarkCloud:r8cMUS7OcXLh5arz@darkcloud.lvb2ter.mongodb.net/lanhouse?retryWrites=true&w=majority&appName=DarkCloud";

if (!MONGODB_URI) {
  throw new Error("Por favor, defina a variável de ambiente MONGODB_URI");
}

let isConnected = false;

export async function connect() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    throw error;
  }
}

const Database = {
  connect
};

export default Database;