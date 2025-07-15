import { Schema, model, models } from "mongoose";

const AdminSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user_name: {
        type: String,
        required: true
    }
}, { 
    collection: 'admins',
    timestamps: true,
    versionKey: false
});

// Garantir que o modelo seja recriado corretamente
try {
    if (models.Admin) {
        delete models.Admin;
    }
} catch (error) {
    console.error('Erro ao limpar modelo Admin:', error);
}

const Admin = model("Admin", AdminSchema);

export default Admin;