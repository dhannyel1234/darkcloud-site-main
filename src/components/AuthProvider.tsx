import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import ClientProvider from './ClientProvider';

export default async function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return <ClientProvider session={session}>{children}</ClientProvider>;
} 