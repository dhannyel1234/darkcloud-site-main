import adminController from "../functions/database/controllers/AdminController";
import Database from "../functions/database/database";

const admins = [
  { user_id: "1028277581734215750", user_name: "Admin" },
  { user_id: "759577977738231839", user_name: "Admin" },
  { user_id: "1337667120485634099", user_name: "Admin" },
  { user_id: "1192108902641303613", user_name: "Admin" },
  { user_id: "827641949305045033", user_name: "Admin" },
];

async function addAdmins() {
  await Database.connect();
  for (const admin of admins) {
    try {
      const existing = await adminController.find({ user_id: admin.user_id });
      if (existing) {
        console.log(`Usuário ${admin.user_id} já é admin.`);
        continue;
      }
      await adminController.create(admin);
      console.log(`Admin ${admin.user_id} adicionado com sucesso!`);
    } catch (err) {
      console.error(`Erro ao adicionar admin ${admin.user_id}:`, err);
    }
  }
  process.exit(0);
}

addAdmins(); 