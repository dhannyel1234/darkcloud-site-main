"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivePlans from "./components/ActivePlans";
import ExpiredPlans from "./components/ExpiredPlans";
import CancelledPlans from "./components/CancelledPlans";

export default function PlansManagementSave() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Gerenciamento de Planos (SAVE)</h1>
        <p className="text-muted-foreground">
          Gerencie todos os planos do sistema em um só lugar (versão SAVE)
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