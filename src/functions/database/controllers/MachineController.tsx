import Database from "../database";
import Machine from "../schemas/MachineSchema";

// Create
const create = async (name: string, data: Partial<{
    surname: string;
    host: string;
    plan: { expirationDate: Date; name: string; };
    connect: { user: string; password: string; };
    ownerId: string;
    openedInvoice: boolean;
}>) => {
    await Database.connect();

    const savedMachine = await Machine.findOneAndUpdate(
        { name },
        { name, ...data },
        { new: true, upsert: true }
    );

    return savedMachine;
};

// Delete
const remove = async (name: string) => {
    await Database.connect();

    const deletedMachine = await Machine.findOneAndDelete({ name });
    return deletedMachine;
};

// Update
const update = async (name: string, data: Partial<{
    surname: string;
    host: string;
    plan: { expirationDate: Date; name: string; };
    connect: { user: string; password: string; };
    ownerId: string;
    openedInvoice: boolean;
}>) => {
    await Database.connect();

    const updatedMachine = await Machine.findOneAndUpdate(
        { name },
        { ...data },
        { new: true }
    );

    return updatedMachine;
};

// Read [Find by Plan]
const find = async (data: { name: string; }) => {
    await Database.connect();

    const machine = await Machine.findOne({ name: data.name });
    return machine;
};

// Read [Find All] [User]
const findAllUser = async (data: { ownerId: string; }) => {
    await Database.connect();

    const machines = await Machine.find({ ownerId: data.ownerId });
    return machines;
};

// Read [Find All]
const findAll = async () => {
    await Database.connect();

    const machines = await Machine.find();
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