'use client';

import { AuthProvider } from '@/shared/hooks';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
