import './globals.css';
import { LanguageProvider } from '@/i18n';

export const metadata = {
  title: 'SafeSight HECTOR — Operational Command & Visitor Safety',
  description: 'AI-Based Visitor Safety, Crowd & Incident Coordination for Eco and Pilgrimage Sites',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#f7f9fb] text-[#191c1e] min-h-screen font-body-base">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

