import { Metadata } from "next";
import PaymentClient from "./payment-client";

export const metadata: Metadata = {
  title: "Pagamento - DarkCloud",
  description: "Página de pagamento da DarkCloud",
};

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PaymentPage({
  params,
  searchParams,
}: Props) {
  return <PaymentClient searchParams={searchParams} />;
}