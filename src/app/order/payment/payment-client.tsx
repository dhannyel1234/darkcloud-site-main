'use client';

import Link from "next/link";
import Image from "next/image";
import "./styles.css";
import { useEffect, useState } from "react";

import {
    ExternalLink,
    Check,
    Copy,
    Lock,
    Cloudy
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

// saves
const DISCORD_GUILD_INVITE = "https://discord.gg/HQbRRazKbB";

interface PaymentClientProps {
  searchParams: { id?: string };
}

export default function PaymentClient({ searchParams }: PaymentClientProps) {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!searchParams.id) {
        setError("Cobrança não encontrada");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/payment/get?id=${searchParams.id}`);
        const data = await res.json();
        
        if (!res.ok || !data || !data.brCode || !data.qrCodeImage) {
          setError("Cobrança não encontrada");
          return;
        }

        setPaymentData(data);
      } catch (error) {
        console.error('Erro ao buscar cobrança:', error);
        setError("Erro ao processar pagamento");
      }
    };

    fetchPayment();
  }, [searchParams.id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button asChild>
          <Link href="/">Voltar para o início</Link>
        </Button>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Pagamento via Pix</h1>
        <div className="flex flex-col items-center space-y-6">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg border">
            <Image
              src={paymentData.qrCodeImage}
              alt="QR Code Pix"
              width={250}
              height={250}
              sizes="(max-width: 768px) 100vw, 250px"
              className="mx-auto"
            />
          </div>
          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Valor a pagar:</p>
            <p className="text-2xl font-bold">
              R$ {(paymentData.price || 0).toFixed(2)}
            </p>
          </div>
          {/* Copiar código Pix */}
          <div className="w-full">
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(paymentData.brCode);
              }}
            >
              Copiar código Pix
            </Button>
          </div>
          {/* Instruções */}
          <div className="text-sm text-gray-600 text-center">
            <p>1. Abra o app do seu banco</p>
            <p>2. Escolha pagar via Pix</p>
            <p>3. Escaneie o QR Code ou cole o código</p>
            <p>4. Confirme o pagamento</p>
          </div>
          {/* Voltar */}
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Voltar para o início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 