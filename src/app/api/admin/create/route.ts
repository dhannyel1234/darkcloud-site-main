import { NextRequest, NextResponse } from "next/server";
import adminController from "@/functions/database/controllers/AdminController";

export async function POST(req: NextRequest) {
  try {
    const { user_id, user_name } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 });
    }

    // Verificar se já é admin
    const existingAdmin = await adminController.find({ user_id });
    if (existingAdmin) {
      return NextResponse.json({ message: "Usuário já é administrador" });
    }

    // Criar admin
    await adminController.create({ user_id, user_name: user_name || "Admin" });
    return NextResponse.json({ success: true, message: "Permissão de admin adicionada com sucesso" });
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    return NextResponse.json({ error: "Erro ao criar admin" }, { status: 500 });
  }
} 