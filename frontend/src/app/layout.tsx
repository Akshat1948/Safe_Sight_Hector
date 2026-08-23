import './globals.css';
import { LanguageProvider } from '@/i18n';

export const metadata = {
  title: 'SafeSight — AI Visitor Safety & Crowd Intelligence',
  description: 'AI-Based Visitor Safety, Crowd & Incident Coordination for Eco and Pilgrimage Sites',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
