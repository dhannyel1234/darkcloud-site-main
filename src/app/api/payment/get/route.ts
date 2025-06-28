import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import paymentController from '@/functions/database/controllers/PaymentController';
import EfiPay from 'sdk-node-apis-efi';

// Configuração do EfiPay
const efipay = new EfiPay({
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  certificate: process.env.EFI_CERT_PATH!,
  sandbox: false,
});

export async function GET(req: NextRequest) {
  try {
    //console.log("🔁 Iniciando verificação de pagamento...");

    // Verifica sessão
    const session = await getServerSession();
    if (!session) {
      console.warn("🔒 Sessão inválida");
      return NextResponse.json(
        {
          error: "Conta não autenticada.",
          support: "@known.js",
        },
        { status: 400 }
      );
    }

    // Lê parâmetros da URL
    const url = new URL(req.url);
    const customId = url.searchParams.get("id");
    //console.log("🔍 custom_id recebido:", customId);

    if (!customId) {
      return NextResponse.json(
        {
          message: "ID não fornecido nos parâmetros",
          support: "@known.js",
        },
        { status: 400 }
      );
    }

    // Busca no banco de dados
    const dbPayment = await paymentController.find({ custom_id: customId });
    //console.log("📦 Resultado do banco de dados:", dbPayment);

    if (!dbPayment) {
      return NextResponse.json(
        {
          message: "Pagamento não encontrado no banco de dados",
          support: "@known.js",
        },
        { status: 404 }
      );
    }

    // Verifica se o payment_id (txid) é válido
    const txid = dbPayment.payment_id;
    if (!txid || typeof txid !== "string" || txid.length < 26 || txid.length > 35) {
      console.error("❌ TXID inválido:", txid);
      return NextResponse.json(
        {
          message: "TXID inválido. Ele deve ter entre 26 e 35 caracteres alfanuméricos.",
          txid,
          support: "@known.js",
        },
        { status: 400 }
      );
    }

    // Consulta o status da cobrança Pix
    const pixStatus = await efipay.pixDetailCharge({ txid });
    //console.log("✅ Status do Pix:", pixStatus);

    // Retorna dados combinados
    const combinedPaymentData = {
      ...dbPayment,
      pix: pixStatus,
    };

    return NextResponse.json(combinedPaymentData, { status: 200 });

  } catch (err: any) {
    console.error("💥 Erro ao consultar pagamento Pix:", err);

    return NextResponse.json(
      {
        message: "Erro ao consultar pagamento Pix",
        error: err?.response?.data || String(err),
        support: '@known.js',
      },
      { status: 500 }
    );
  }
}