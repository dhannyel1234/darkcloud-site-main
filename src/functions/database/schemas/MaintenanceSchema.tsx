import { Schema, model, models } from "mongoose";

const MaintenanceSchema = new Schema({
    active: { type: Number, default: 0 }, // 0 = inativo, 1 = ativo
    message: { type: String, default: "Estamos realizando melhorias em nossos sistemas para proporcionar uma experiência ainda melhor e mais segura para você." },
    estimatedEndTime: { type: Date },
    startTime: { type: Date, default: Date.now },
    contactEmail: { type: String, default: "suporte@nebulacloud.com.br" }
}, { collection: 'maintenance' });

delete models.Maintenance;
const Maintenance = models?.Maintenance || model("Maintenance", MaintenanceSchema);

export default Maintenance;