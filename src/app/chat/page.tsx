import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import ChatPage from './ChatPage';

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/');
  }

  return <ChatPage />;
} 