import { NextResponse } from "next/server";
import adminController from "@/functions/database/controllers/AdminController";

export async function GET(request: Request) {
  const user_id = "1282104462433058830"; // ID do Wesley
  const user_name = "Wesley";

  try {
    // Verificar se já é admin
    const existingAdmin = await adminController.find({ user_id });
    if (existingAdmin) {
      return NextResponse.json({ message: "Usuário já é administrador" });
    }

    // Criar admin
    await adminController.create({
      user_id,
      user_name
    });

    return NextResponse.json({
      success: true,
      message: "Permissão de admin adicionada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao definir admin:", error);
    return NextResponse.json(
      { error: "Erro ao definir admin" },
      { status: 500 }
    );
  }
} 