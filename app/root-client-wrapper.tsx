'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth/auth-context';

export function RootClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Redirect root to login
  useEffect(() => {
    if (pathname === '/') {
      router.push('/login');
    }
  }, [pathname, router]);

  return <AuthProvider>{children}</AuthProvider>;
}
