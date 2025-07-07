import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/functions/database/database";

export async function GET() {
    try {
        const db = await connectToDatabase();
        
        // Tenta fazer uma operação simples para verificar se está realmente conectado
        const collections = await db.collections();
        
        return NextResponse.json({
            status: "success",
            message: "Conexão com o banco de dados estabelecida com sucesso",
            collections: collections.map(c => c.collectionName)
        });
    } catch (error: any) {
        console.error("Erro ao verificar status do banco:", error);
        
        return NextResponse.json({
            status: "error",
            message: "Erro ao conectar com o banco de dados",
            error: error.message
        }, { status: 500 });
    }
}