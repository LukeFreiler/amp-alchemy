import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth-options';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect('/sessions');
  }

  redirect('/auth/signin');
}
