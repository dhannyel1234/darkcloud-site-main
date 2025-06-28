import Database from "../database";
import Stock from "../schemas/StockSchema";

// Create
const create = async (data: Partial<{ quantity: number; }>) => {
    await Database.connect();

    const db = new Stock(data);
    return await db.save();
};

// Read [Find by Plan]
const find = async (data: Partial<{ quantity: number; }>) => {
    await Database.connect();

    const db = await Stock.findOne(data);
    return db;
};

// Update [Edit]
const update = async (updates: Partial<{ quantity: number; }>) => {
    await Database.connect();

    const db = await Stock.updateMany({}, updates, { new: true });
    return db;
};

const controller = {
    create,
    find,
    update
};

export default controller;