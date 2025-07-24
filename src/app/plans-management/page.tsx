"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivePlans from "./components/ActivePlans";
import ExpiredPlans from "./components/ExpiredPlans";
import CancelledPlans from "./components/CancelledPlans";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';

export default function PlansManagement() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const session = await getSession();
      if (!session) {
        signIn('discord', { redirect: true });
        return;
      }
      const response = await fetch(`/api/admin/get?user_id=${session.user.id}`);
      const data = await response.json();
      if (!data || data.message) {
        router.push('/');
        return;
      }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <span className="text-lg">Verificando permissões...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Gerenciamento de Planos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os planos do sistema em um só lugar
        </p>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">Planos Ativos</TabsTrigger>
          <TabsTrigger value="expired">Planos Expirados</TabsTrigger>
          <TabsTrigger value="cancelled">Planos Cancelados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          <ActivePlans />
        </TabsContent>
        
        <TabsContent value="expired" className="mt-0">
          <ExpiredPlans />
        </TabsContent>
        
        <TabsContent value="cancelled" className="mt-0">
          <CancelledPlans />
        </TabsContent>
      </Tabs>
    </div>
  );
} 