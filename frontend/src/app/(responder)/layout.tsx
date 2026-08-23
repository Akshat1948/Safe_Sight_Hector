'use client';

import { AuthProvider } from '@/shared/hooks';

export default function ResponderRootLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
