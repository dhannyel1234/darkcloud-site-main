import { NextRequest, NextResponse } from 'next/server';
import paymentController from '@/functions/database/controllers/PaymentController';
import EfiPay from 'sdk-node-apis-efi';

const efipay = new EfiPay({
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  certificate: process.env.EFI_CERT_PATH!,
  sandbox: false,
});

export async function POST(req: NextRequest) {
  try {
    const { customId } = await req.json();

    if (!customId) {
      return NextResponse.json(
        {
          message: 'Some parameter was not defined',
          support: '@known.js'
        },
        { status: 400 }
      );
    }

    const dbPayment = await paymentController.find({ custom_id: customId });

    if (!dbPayment || !dbPayment.payment_id) {
      return NextResponse.json(
        {
          message: "Payment not found in the database",
          support: "@known.js"
        },
        { status: 404 }
      );
    }

    const txid = dbPayment.payment_id;
    const refundValue = dbPayment.price?.toFixed(2) || "0.00";

    const data = {
      valor: refundValue,
    };

    const devolutionId = `dev-${Date.now()}`; // ID único para reembolso

    const response = await efipay.pixDevolution({ e2eId: txid, id: devolutionId }, data);

    return NextResponse.json({ refund: response });

  } catch (err) {
    console.error("❌ Erro no reembolso:", err);
    return NextResponse.json(
      {
        message: "Refund failed",
        error: String(err),
        support: '@known.js'
      },
      { status: 500 }
    );
  }
}