import Database from "../database";
import Invoice from "../schemas/InvoiceSchema";

// Create
const create = async (id: string, data: Partial<{
    machine: { name: string; }
    invoice: { expirationDate: Date; };
    ownerId: string;
}>) => {
    await Database.connect();

    const savedInvoice = await Invoice.findOneAndUpdate(
        { id },
        { ...data },
        { new: true, upsert: true }
    );

    return savedInvoice;
};

// Delete
const remove = async (name: string) => {
    await Database.connect();

    const deletedInvoice = await Invoice.findOneAndDelete({ name });

    return deletedInvoice;
};

// Update
const update = async (id: string, data: Partial<{
    machine: { name: string; }
    invoice: { expirationDate: Date; };
    ownerId: string;
}>) => {
    await Database.connect();

    const updatedInvoice = await Invoice.findOneAndUpdate(
        { id },
        { ...data },
        { new: true }
    );

    return updatedInvoice;
};

// Read [Find by Plan]
const find = async (data: { name: string; }) => {
    await Database.connect();

    const invoice = await Invoice.findOne({ "machine.name": data.name });
    return invoice;
};

// Read [Find All] [User]
const findAllUser = async (data: { ownerId: string; }) => {
    await Database.connect();

    const invoices = await Invoice.find({ ownerId: data.ownerId });
    return invoices;
};

// Read [Find All]
const findAll = async () => {
    await Database.connect();

    const machines = await Invoice.find();
    return machines;
};

const controller = {
    create,
    remove,
    update,
    find,
    findAllUser,
    findAll
};

export default controller;