import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      isAuthenticated: !!session,
      user: session?.user,
      role: session?.user?.role
    });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json(
      { error: "Erro ao verificar sessão" },
      { status: 500 }
    );
  }
} 