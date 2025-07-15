import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddPlanDialogProps {
  onSuccess: () => void;
}

export default function AddPlanDialog({ onSuccess }: AddPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    userId: "",
    userName: "",
    planType: "",
    duration: "",
  });

  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (formData.planType === "alfa") {
      // Para plano Alfa, permitir formato HH:MM
      setFormData({ ...formData, duration: value });
    } else {
      // Para outros planos, permitir apenas números
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, duration: numericValue });
    }
  };

  const handleSubmit = async () => {
    if (!formData.userId || !formData.userName || !formData.planType || !formData.duration) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let duration: number;

      if (formData.planType === "alfa") {
        // Validar formato HH:MM para plano Alfa
        if (!validateTimeFormat(formData.duration)) {
          throw new Error("Formato de tempo inválido. Use HH:MM (exemplo: 02:30)");
        }
        const [hours, minutes] = formData.duration.split(":").map(Number);
        duration = hours + (minutes / 60); // Converter para horas
        
        if (duration <= 0) {
          throw new Error("A duração deve ser maior que zero");
        }

        // Log para debug
        console.log('DEBUG - Duração do plano Alfa:', {
          hours,
          minutes,
          duration,
          durationInMinutes: duration * 60
        });
      } else {
        // Validar número de dias para outros planos
        const days = parseInt(formData.duration);
        if (isNaN(days) || days <= 0) {
          throw new Error("Por favor, insira um número válido de dias");
        }
        duration = days; // Manter em dias para outros planos
      }

      // Log para debug
      console.log('DEBUG - Enviando plano:', {
        userId: formData.userId,
        userName: formData.userName,
        planType: formData.planType,
        duration,
        originalDuration: formData.duration
      });

      const response = await fetch("/api/plans/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.userId,
          userName: formData.userName,
          planType: formData.planType,
          duration: duration // Enviar em horas para Alfa e em dias para outros planos
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao adicionar plano");
      }

      toast.success("Plano adicionado com sucesso");
      setOpen(false);
      onSuccess();
      setFormData({ userId: "", userName: "", planType: "", duration: "" });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar plano",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Plano</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Plano</DialogTitle>
          <DialogDescription>
            Adicione um novo plano para um usuário. Preencha todos os campos obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userId" className="text-right">
              ID do Usuário
            </Label>
            <Input
              id="userId"
              className="col-span-3"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              placeholder="ID do Discord"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userName" className="text-right">
              Nome do Usuário
            </Label>
            <Input
              id="userName"
              className="col-span-3"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="planType" className="text-right">
              Tipo do Plano
            </Label>
            <Select
              value={formData.planType}
              onValueChange={(value) => setFormData({ ...formData, planType: value, duration: "" })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo do plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alfa">Alfa</SelectItem>
                <SelectItem value="omega">Omega</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              {formData.planType === "alfa" ? "Duração (HH:MM)" : "Duração (Dias)"}
            </Label>
            <Input
              id="duration"
              className="col-span-3"
              value={formData.duration}
              onChange={handleDurationChange}
              placeholder={formData.planType === "alfa" ? "Ex: 02:30" : "Ex: 7"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? "Adicionando..." : "Adicionar Plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 