import { Schema, model, models } from "mongoose";

const InvoiceSchema = new Schema({
    id: { type: String, required: true },
    machine: {
        name: { type: String, required: true }
    },
    invoice: {
        expirationDate: { type: Date, required: true },
    },
    ownerId: { type: String, required: true }
}, { collection: 'invoices' });

delete models.Invoice;
const Invoice = models?.Invoice || model("Invoice", InvoiceSchema);

export default Invoice;