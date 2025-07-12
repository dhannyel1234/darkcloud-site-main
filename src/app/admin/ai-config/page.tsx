import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { AIConfigController } from '@/functions/database/controllers/AIConfigController';
import AIConfigPage from './AIConfigPage';

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/');
  }

  if (!session.user.role || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const configs = await AIConfigController.getAll();

  return <AIConfigPage initialConfigs={configs} />;
} 