import Database from "../database";
import Admin from "../schemas/AdminSchema";

// Create
const create = async (data: { user_id: string; user_name: string; }) => {
    await Database.connect();

    const { user_id, user_name } = data;
    const db = new Admin({ user_id, user_name });
    return await db.save();
};

// Read [Find by Email and ID]
const find = async (data: { user_id: string; }) => {
    await Database.connect();

    const { user_id } = data;
    const db = await Admin.findOne({ user_id });
    return db;
};

// Read [Find All]
const findAll = async () => {
    await Database.connect();

    const admins = await Admin.find({}, 'user_id user_name');
    return admins;
};

// Remove (Delete)
const remove = async (data: { user_id: string; }) => {
    await Database.connect();

    const { user_id } = data;
    return Admin.findOneAndDelete({ user_id });
};

const controller = {
    create,
    find,
    findAll,
    remove
};

export default controller;