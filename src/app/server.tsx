const NEXTAUTH_URL = process.env.NEXTAUTH_URL;
export default async function runTask() {
    await fetch(`${NEXTAUTH_URL}/api/expirations/machine`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' }
    }).catch((err) => console.log('[Scheduler] Erro ao efetuá-lo.', err));
};