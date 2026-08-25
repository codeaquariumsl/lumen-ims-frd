'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Toaster } from 'sonner';

export function RootClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Redirect root to login
  useEffect(() => {
    if (pathname === '/') {
      router.push('/login');
    }
  }, [pathname, router]);

  return (
    <AuthProvider>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </AuthProvider>
  );
}

