import { Schema, model, models } from "mongoose";

const QueueMachineSchema = new Schema({
    name: { type: String, required: true },
    ip: { type: String, required: true },
    user: { type: String, required: true },
    password: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['available', 'in_use', 'maintenance'], 
        default: 'available' 
    },
    currentUserId: { type: String },
    lastUsed: { type: Date },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'queue_machines' });

delete models.QueueMachine;
const QueueMachine = models?.QueueMachine || model("QueueMachine", QueueMachineSchema);

export default QueueMachine; 