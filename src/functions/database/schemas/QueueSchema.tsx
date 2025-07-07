import { Schema, model, models } from "mongoose";

const QueueSchema = new Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userImage: { type: String },
    plan: { 
        name: { type: String, required: true },
        type: { type: String, enum: ['alfa', 'omega', 'beta'], required: true },
        duration: { type: Number, required: true }, // em minutos
        startTime: { type: Date },
        endTime: { type: Date }
    },
    status: { 
        type: String, 
        enum: ['waiting', 'active', 'completed', 'expired'], 
        default: 'waiting' 
    },
    position: { type: Number, required: true },
    joinedAt: { type: Date, default: Date.now },
    activatedAt: { type: Date },
    completedAt: { type: Date },
    machineInfo: {
        ip: { type: String },
        user: { type: String },
        password: { type: String },
        name: { type: String },
        connectLink: { type: String }
    }
}, { collection: 'queue' });

delete models.Queue;
const Queue = models?.Queue || model("Queue", QueueSchema);

export default Queue; 