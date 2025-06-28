import Database from "../database";
import Maintenance from "../schemas/MaintenanceSchema";

// Obter status de manutenção
const getStatus = async () => {
    await Database.connect();

    // Busca o documento de manutenção ou cria um novo se não existir
    let maintenance = await Maintenance.findOne({});
    if (!maintenance) {
        maintenance = await Maintenance.create({ active: 0 });
    }
    
    return maintenance;
};

// Atualizar status de manutenção
const updateStatus = async (status: number) => {
    await Database.connect();

    // Busca o documento de manutenção ou cria um novo se não existir
    let maintenance = await Maintenance.findOne({});
    if (!maintenance) {
        maintenance = await Maintenance.create({ active: status });
        return maintenance;
    }

    // Atualiza o status
    maintenance = await Maintenance.findOneAndUpdate(
        {}, 
        { active: status }, 
        { new: true }
    );
    
    return maintenance;
};

const controller = {
    getStatus,
    updateStatus
};

export default controller;