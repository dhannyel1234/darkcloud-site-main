import { NextResponse } from "next/server";
import adminController from "@/functions/database/controllers/AdminController";
import Database from "@/functions/database/database";

export async function GET() {
  console.log('🚀 Iniciando rota add-first...');
  
  try {
    console.log('🔄 Tentando conectar ao banco de dados...');
    await Database.connect();
    console.log('✅ Conexão estabelecida');
    
    const user_id = "971901593328967730";
    const user_name = "_d_";

    console.log('🔍 Verificando admins existentes...');
    // Verificar se já existe algum admin
    const allAdmins = await adminController.findAll();
    console.log('📊 Admins encontrados:', allAdmins?.length || 0);
    
    if (allAdmins && allAdmins.length > 0) {
      console.log('ℹ️ Já existem administradores no sistema');
      return NextResponse.json({ 
        message: "Já existem administradores no sistema",
        admins: allAdmins
      });
    }

    console.log('🔍 Verificando se usuário já é admin...');
    // Verificar se já é admin
    const existingAdmin = await adminController.find({ user_id });
    if (existingAdmin) {
      console.log('ℹ️ Usuário já é administrador');
      return NextResponse.json({ 
        message: "Usuário já é administrador",
        admin: existingAdmin
      });
    }

    console.log('➕ Criando novo admin...');
    // Criar admin
    const newAdmin = await adminController.create({
      user_id,
      user_name
    });

    console.log('✅ Admin criado com sucesso:', newAdmin);
    return NextResponse.json({
      success: true,
      message: "Permissão de admin adicionada com sucesso",
      admin: newAdmin
    });
  } catch (error) {
    console.error("❌ Erro ao definir admin:", error);
    
    // Tentar obter mais informações sobre o erro
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error);

    return NextResponse.json(
      { 
        error: "Erro ao definir admin",
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 