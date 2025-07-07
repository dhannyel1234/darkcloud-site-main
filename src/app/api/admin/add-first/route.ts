import { NextResponse } from "next/server";
import adminController from "@/functions/database/controllers/AdminController";
import Database from "@/functions/database/database";

export async function GET() {
  try {
    await Database.connect();
    
    const user_id = "971901593328967730";
    const user_name = "_d_";

    // Verificar se já existe algum admin
    const allAdmins = await adminController.findAll();
    if (allAdmins && allAdmins.length > 0) {
      return NextResponse.json({ 
        message: "Já existem administradores no sistema",
        admins: allAdmins
      });
    }

    // Verificar se já é admin
    const existingAdmin = await adminController.find({ user_id });
    if (existingAdmin) {
      return NextResponse.json({ 
        message: "Usuário já é administrador",
        admin: existingAdmin
      });
    }

    // Criar admin
    const newAdmin = await adminController.create({
      user_id,
      user_name
    });

    return NextResponse.json({
      success: true,
      message: "Permissão de admin adicionada com sucesso",
      admin: newAdmin
    });
  } catch (error) {
    console.error("Erro ao definir admin:", error);
    return NextResponse.json(
      { error: "Erro ao definir admin: " + error },
      { status: 500 }
    );
  }
} 