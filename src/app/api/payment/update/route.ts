import { NextRequest, NextResponse } from 'next/server';
import paymentController from '@/functions/database/controllers/PaymentController';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customId, name, email, checked_all, machine_created } = body;

    // Verifica se o customId foi fornecido
    if (!customId) {
      return NextResponse.json(
        {
          message: 'Custom ID not defined',
          support: '@known.js'
        },
        { status: 400 }
      );
    }

    // Chama o método de atualização do controller
    const update = await paymentController.update({
      custom_id: customId,
      updates: {
        plan: name,
        email,
        checked_all,
        machine_created
      }
    });

    // Se o update for bem-sucedido, retorna um status 200 com a resposta
    return NextResponse.json({ success: true, update }, { status: 200 });

  } catch (err) {
    // Caso haja erro, retorna status 500 com a mensagem de erro
    return NextResponse.json(
      {
        message: "Database update failed",
        error: String(err),
        support: '@known.js'
      },
      { status: 500 }
    );
  }
}