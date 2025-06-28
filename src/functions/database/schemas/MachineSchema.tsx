import { Schema, model, models } from "mongoose";

const MachineSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    host: { type: String, enum: ["azure", "amazon", "google"], required: true },
    plan: {
        expirationDate: { type: Date, required: true },
        name: { type: String, required: true }
    },
    connect: {
        user: { type: String, required: true },
        password: { type: String, required: true }
    },
    ownerId: { type: String, required: true },
    openedInvoice: { type: Boolean, required: true },
}, { collection: 'machines' });

delete models.Machine;
const Machine = models?.Machine || model("Machine", MachineSchema);

export default Machine;