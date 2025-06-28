import { Schema, model, models } from "mongoose";

const AdminSchema = new Schema({
    user_id: String,
    user_name: String
}, { collection: 'admins' });

delete models.Admin;
const Admin = models?.Admin || model("Admin", AdminSchema);

export default Admin;