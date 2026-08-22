'use client';

import React from 'react';
import { AuthProvider } from '@/shared/hooks';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
