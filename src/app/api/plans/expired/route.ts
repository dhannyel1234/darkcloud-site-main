import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { UserPlanController } from "@/functions/database/controllers/UserPlanController";

export async function GET() {
  console.log('[API] /plans/expired - Iniciando requisição...', new Date().toISOString());
  
  try {
    const session = await getServerSession(authOptions);
    
    // Verifica se o usuário está autenticado
    if (!session?.user) {
      console.log('[API] /plans/expired - Usuário não autenticado');
      return NextResponse.json(
        { error: "Não autorizado - Usuário não autenticado" },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Verifica se o usuário tem a role admin
    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
      console.log('[API] /plans/expired - Usuário não é admin:', userRole);
      return NextResponse.json(
        { error: "Não autorizado - Permissão insuficiente" },
        { 
          status: 403,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    console.log('[API] /plans/expired - Buscando planos expirados...');
    const userPlanController = new UserPlanController();
    const expiredPlans = await userPlanController.getExpiredPlans();

    console.log('[API] /plans/expired - Planos encontrados:', {
      quantidade: expiredPlans.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(expiredPlans, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("[API] /plans/expired - Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos expirados" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 