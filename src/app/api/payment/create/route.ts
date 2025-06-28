import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import paymentController from '@/functions/database/controllers/PaymentController';
import EfiPay from 'sdk-node-apis-efi';

const efipay = new EfiPay({
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  certificate: process.env.EFI_CERT_PATH!,
  sandbox: false,
});

async function ExpirePayment(custom_id: string) {
  try {
    await paymentController.remove({ custom_id });
  } catch (err) {
    console.warn("Erro ao remover pagamento expirado:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    //console.log("➡️ Iniciando criação de pagamento PIX...");

    const session = await getServerSession();
    if (!session) {
      console.warn("❌ Sessão inválida");
      return NextResponse.json(
        { error: "Unauthenticated account.", support: "@known.js" },
        { status: 400 }
      );
    }

    const { customId, name, price, email, clientName, clientCpf } = await req.json();
    //console.log("📦 Dados recebidos:", { customId, name, price, email, clientName, clientCpf });

    if (!customId || !name || !price || !email) {
      console.warn("❌ Parâmetros obrigatórios ausentes.");
      return NextResponse.json(
        { message: 'Missing parameters', support: '@known.js' },
        { status: 400 }
      );
    }

    // Validar o formato do valor
    const formattedPrice = Number(price).toFixed(2);
    const regex = /^[0-9]{1,10}\.[0-9]{2}$/;
    if (!regex.test(formattedPrice)) {
      console.error("❌ Valor inválido:", formattedPrice);
      return NextResponse.json(
        { message: 'Invalid price format', support: '@known.js' },
        { status: 400 }
      );
    }

    const txid = customId;

    const body: any = {
      calendario: { expiracao: 900 },
      valor: { original: formattedPrice },
      chave: "4186b578-134c-41be-be5d-9f648cbff1f4",
      infoAdicionais: [
        { nome: "Plano", valor: `Máquina Virtual - ${name}` }
      ]
    };

    if (clientName && clientCpf) {
      body.devedor = {
        nome: clientName,
        cpf: '461.753.240-48', // Corrigido o CPF para o valor correto
      };
    }

    //console.log("📤 Enviando cobrança para EfiPay:", { txid, body });

    const charge = await efipay.pixCreateImmediateCharge({ txid }, body);
    //console.log("✅ Cobrança criada:", charge);

    // Usando o txid gerado pela EfiPay
    const txidCriado = charge?.txid;
    if (!txidCriado) {
      throw new Error("TXID não foi gerado pela EfiPay.");
    }

    const locId = charge?.loc?.id;
    //console.log("🔍 ID de localização da cobrança:", locId);

    if (!locId || isNaN(Number(locId))) {
      throw new Error("ID inválido retornado da cobrança. Não foi possível gerar o QR Code.");
    }

    const qrcode = await efipay.pixGenerateQRCode({ id: Number(locId) });
    //console.log("✅ QR Code gerado com sucesso.");

    const timeout = setTimeout(async () => {
      //console.log("⏰ Expirando pagamento após 15 minutos.");
      await ExpirePayment(customId);
    }, 900_000);

    // Salvando o pagamento no banco de dados
    await paymentController.create({
      custom_id: customId,
      payment_id: txidCriado,  // Usando o txid gerado pela EfiPay
      email,
      plan: name,
      checked_all: false,
      machine_created: false,
      timeout_id: String(timeout),
    });

    //console.log("💾 Pagamento salvo no banco de dados com sucesso.");

    return NextResponse.json({
      txid: txidCriado,
      qrcode: qrcode.imagemQrcode,
      copiaecola: qrcode.qrcode
    });

  } catch (err) {
    console.error("❌ Erro ao criar pagamento:", err);
    return NextResponse.json(
      {
        message: "Erro ao criar cobrança PIX",
        error: String(err),
        support: '@known.js'
      },
      { status: 500 }
    );
  }
}