import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import adminController from "@/functions/database/controllers/AdminController";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    try {
      // Criar admin usando o controller
      await adminController.create({
        user_id: session.user.id,
        user_name: session.user.name || 'Admin'
      });

      return NextResponse.json({
        success: true,
        message: "Permissão de admin adicionada com sucesso"
      });
    } catch (dbError) {
      console.error("Erro ao criar admin:", dbError);
      return NextResponse.json(
        { error: "Erro ao criar admin" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao definir admin:", error);
    return NextResponse.json(
      { error: "Erro ao definir admin: " + (error instanceof Error ? error.message : "Erro desconhecido") },
      { status: 500 }
    );
  }
} 